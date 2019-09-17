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
const modalBody = document.querySelector('.modal-body');
const modalCancel = document.querySelector('.modal-cancel');
const modalTitle = document.querySelector('.modal-title');
const getSelectorItems = (selector, prop) => Array.prototype.slice
  .call(document.querySelectorAll(selector)).map((el) => el[prop]);
const domparser = new DOMParser();
const getXmlContent = xmlFile => domparser.parseFromString(xmlFile.request.responseText, 'text/xml');
const getTitleData = xmlData => xmlData.querySelector('title').textContent;
const getDescriptionData = xmlData => xmlData.querySelector('description').textContent;
const getRssPosts = xmlData => xmlData.querySelectorAll('item');
const buildProxyPath = path => `https://cors-anywhere.herokuapp.com/${path}`;

export default () => {
  const state = {
    expectedNewValue: false,
    expectedModal: false,
    valid: true,
    inputValue: '',
    currentPost: '',
    amountElements: 0,
  };

  watch(state, ['expectedNewValue', 'expectedModal', 'valid'], () => {
    inputRss.setAttribute('class', 'form-control');
    if (!state.valid) {
      inputRss.setAttribute('class', 'form-control is-invalid');
    }
    if (state.expectedModal) {
      const postTitleList = postsList.querySelectorAll('.post-title');
      postTitleList.forEach(title => {
        if (title.textContent === state.currentPost) {
          const currentPostDescription = title.parentElement.parentElement;
          modalTitle.textContent = title.textContent;
          modalBody.textContent = currentPostDescription.querySelector('.post-description').textContent;
        }
      });
    }
    if (state.expectedNewValue) {
      axios.get(buildProxyPath(state.inputValue))
        .then(rssPath => {
          const xmlContent = getXmlContent(rssPath);
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

          const addP = (posts) => {
            posts.forEach((post) => {
              const currPosts = getSelectorItems('.post-title', 'textContent');
              if (!isIn(getTitleData(post), currPosts)) {
                const rssPostElement = document.createElement('a');
                const rssPostTitleContainer = document.createElement('div');
                const rssPostTitle = document.createElement('h5');
                const rssPostButton = document.createElement('button');
                const rssPostDescription = document.createElement('p');

                rssPostElement.setAttribute('class', 'list-group-item list-group-item-action flex-column');
                rssPostTitleContainer.setAttribute('class', 'd-flex w-100');
                rssPostTitle.setAttribute('class', 'mb-1 post-title');
                rssPostButton.setAttribute('class', 'btn btn-primary');
                rssPostButton.setAttribute('data-toggle', 'modal');
                rssPostButton.setAttribute('data-target', '#exampleModal');
                rssPostDescription.setAttribute('class', 'mb-1 d-none post-description');
                rssPostTitle.textContent = getTitleData(post);
                rssPostButton.textContent = 'More';
                rssPostDescription.textContent = getDescriptionData(post);

                rssPostTitleContainer.append(rssPostTitle);
                rssPostElement.append(rssPostTitleContainer, rssPostButton, rssPostDescription);
                postsList.append(rssPostElement);
              }
            });
          };
          setInterval(() => {
            const rssListData = getSelectorItems('.rss-flow', 'name');
            rssListData.map(rssItem => axios.get(buildProxyPath(rssItem)).then(listeningPath => {
              const listeningXmlContent = getXmlContent(listeningPath);
              const rssPosts = getRssPosts(listeningXmlContent);
              addP(rssPosts);
            }).catch(error => console.log(error)));
          }, 6000);
        }).catch(error => console.log(error));
      inputRss.value = '';
    }
  });

  const submitValue = () => {
    const rssListData = getSelectorItems('.rss-flow', 'name');
    if (!state.expectedNewValue) {
      if (isIn(state.inputValue.trim(), rssListData) || !isURL(state.inputValue)) {
        state.valid = false;
      } else {
        state.amountElements += 1;
        state.expectedNewValue = true;
      }
    }
  };

  inputRss.addEventListener('input', (e) => {
    state.valid = true;
    state.expectedNewValue = false;
    state.inputValue = e.target.value;
  });

  postsList.addEventListener('click', ({ target }) => {
    if (target.hasAttribute('data-toggle')) {
      state.expectedModal = true;
      state.expectedNewValue = false;
      state.currentPost = target.parentElement.querySelector('.post-title').textContent;
    }
  });
  modalCancel.addEventListener('click', () => {
    state.expectedModal = false;
  });
  submitRss.addEventListener('click', submitValue);
  document.addEventListener('keyup', ({ keyCode }) => {
    if (keyCode === 13) {
      submitValue();
    }
  });
};
