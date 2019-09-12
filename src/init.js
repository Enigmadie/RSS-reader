import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
import 'bootstrap/js/dist/alert';
import 'bootstrap/js/dist/util';
import 'bootstrap/dist/css/bootstrap.min.css';
import { isURL, isIn } from 'validator';
import { watch } from 'melanke-watchjs';
import axios from 'axios';

const inputRss = document.querySelector('.form-control');
const submitRss = document.querySelector('.btn');
const rssFlowList = document.querySelector('.rss-flow-group');
const postsList = document.querySelector('.posts-group');
const getRssListData = () => Array.prototype.slice.call(document.querySelectorAll('.rss-flow')).map((el) => el.name);
const domparser = new DOMParser();
const getXmlContent = xmlFile => domparser.parseFromString(xmlFile.request.responseText, 'text/xml');
const getTitleData = xmlData => xmlData.querySelector('title').textContent;
const getDescriptionData = xmlData => xmlData.querySelector('description').textContent;
const getRssPosts = xmlData => xmlData.querySelectorAll('item');
const buildProxyPath = path => `https://cors-anywhere.herokuapp.com/${path}`;

export default () => {
  const state = {
    inputValue: '',
    expectedNewValue: false,
    valid: true,
  };

  watch(state, () => {
    inputRss.setAttribute('class', 'form-control');
    if (!state.valid) {
      inputRss.setAttribute('class', 'form-control is-invalid');
    }
    if (state.expectedNewValue) {
      axios.get(buildProxyPath(state.inputValue))
        .then(e => {
          const xmlContent = getXmlContent(e);
          const rssFlowElement = document.createElement('a');
          const rssFlowTitleContainer = document.createElement('div');
          const rssFlowTitle = document.createElement('h5');
          const rssFlowDescription = document.createElement('p');

          rssFlowElement.setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
          rssFlowElement.setAttribute('name', state.inputValue);
          rssFlowTitleContainer.setAttribute('class', 'd-flex w-100');
          rssFlowTitle.setAttribute('class', 'mb-1');
          rssFlowDescription.setAttribute('class', 'mb-1');
          rssFlowTitle.textContent = getTitleData(xmlContent);
          rssFlowDescription.textContent = getDescriptionData(xmlContent);

          rssFlowTitleContainer.append(rssFlowTitle);
          rssFlowElement.append(rssFlowTitleContainer, rssFlowDescription);
          rssFlowList.append(rssFlowElement);

          const rssPosts = getRssPosts(xmlContent);
          rssPosts.forEach(post => {
            const rssPostElement = document.createElement('a');
            const rssPostTitleContainer = document.createElement('div');
            const rssPostTitle = document.createElement('h5');
            const rssPostDescription = document.createElement('p');

            rssPostElement.setAttribute('class', 'list-group-item list-group-item-action flex-column');
            rssPostTitleContainer.setAttribute('class', 'd-flex w-100');
            rssPostTitle.setAttribute('class', 'mb-1');
            rssPostDescription.setAttribute('class', 'mb-1');

            rssPostTitle.textContent = getTitleData(post);
            rssPostDescription.textContent = getDescriptionData(post);

            rssPostTitleContainer.append(rssPostTitle);
            rssPostElement.append(rssPostTitleContainer, rssPostDescription);
            postsList.append(rssPostElement);
          });
        }).catch(error => console.log(error));
      inputRss.value = '';
    }
  });

  const submitValue = () => {
    const rssListData = getRssListData();
    if (!state.expectedNewValue) {
      if (isIn(state.inputValue.trim(), rssListData) || !isURL(state.inputValue)) {
        state.valid = false;
      } else {
        state.expectedNewValue = true;
      }
    }
  };

  inputRss.addEventListener('input', (e) => {
    state.valid = true;
    state.expectedNewValue = false;
    state.inputValue = e.target.value;
  });

  submitRss.addEventListener('click', submitValue);
  document.addEventListener('keyup', ({ keyCode }) => {
    if (keyCode === 13) {
      submitValue();
    }
  });
};
