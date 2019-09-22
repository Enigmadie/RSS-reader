import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
//import 'bootstrap/js/dist/alert';
//import 'bootstrap/js/dist/util';
import 'bootstrap/dist/css/bootstrap.min.css';
import { isURL, isIn } from 'validator';
import { watch } from 'melanke-watchjs';
import axios from 'axios';

const domparser = new DOMParser();
const inputRssElement = document.querySelector('.form-control');
const submitRssElement = document.querySelector('.btn');
const rssListContainter = document.querySelector('.rss-flow-group');
const postListContainer = document.querySelector('.posts-group');
const modalFadeElement = document.querySelector('.fade');
const modalBodyElement = document.querySelector('.modal-body');
const modalTitleElement = document.querySelector('.modal-title');

const getSelectorContentItems = (selector, prop = 'textContent', dataProp = null) => Array.prototype
  .slice
  .call(document.querySelectorAll(selector))
  .map(el => (prop === 'data') ?  el.dataset[dataProp] : el[prop]);
const getSelectorContent = (el, selector, prop = 'textContent') => el.querySelector(selector)[prop];
const getSelectorItems = (el, selector) => el.querySelectorAll(selector);
const getXmlContent = xmlFile => domparser.parseFromString(xmlFile.request.responseText, 'text/xml');
const buildPath = path => `https://cors-anywhere.herokuapp.com/${path}`;

export default () => {
  const state = {
    expectedNewValue: false,
    expectedModal: false,
    expectedActiveItem: false,
    valid: true,
    inputValue: '',
    currentPost: '',
    activeRssId: 0,
  };

  watch(state, ['expectedNewValue', 'expectedModal', 'valid'], () => {
    inputRssElement.setAttribute('class', 'form-control');
    if (!state.valid) {
      inputRssElement.setAttribute('class', 'form-control is-invalid');
    }
    if (state.expectedModal) {
      const postTitleList = getSelectorItems(postListContainer, '.post-title');
      postTitleList.forEach(title => {
        if (title.textContent === state.currentPost) {
          const modalPostDescription = title.parentElement.parentElement;
          const modalBodyContent = getSelectorContent(modalPostDescription, '.post-description');
          modalTitleElement.textContent = title.textContent;
          modalBodyElement.textContent = modalBodyContent;
        }
      });
    }
    if (state.expectedNewValue) {
      const currentPath = buildPath(state.inputValue);
      axios.get(currentPath)
        .then(xmlFile => {
          const xmlContent = getXmlContent(xmlFile);
          const rssFlowContainer = document.createElement('a');
          const rssFlowTitleContainer = document.createElement('div');
          const rssFlowTitleElement = document.createElement('h5');
          const rssFlowDescriptionElement = document.createElement('p');

          const rssFlowTitleContent = getSelectorContent(xmlContent, 'title');
          const rssFlowDescriptionContent = getSelectorContent(xmlContent, 'description');

          rssFlowContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
          rssFlowContainer.setAttribute('data-path', currentPath);
          rssFlowTitleContainer.setAttribute('class', 'd-flex w-100');
          rssFlowTitleElement.setAttribute('class', 'mb-1');
          rssFlowDescriptionElement.setAttribute('class', 'mb-1');

          rssFlowTitleElement.textContent = rssFlowTitleContent;
          rssFlowDescriptionElement.textContent = rssFlowDescriptionContent;

          rssFlowTitleContainer.append(rssFlowTitleElement);
          rssFlowContainer.append(rssFlowTitleContainer, rssFlowDescriptionElement);
          rssListContainter.append(rssFlowContainer);

          const addPosts = (posts, id) => {
            posts.forEach(post => {
              const uploadedPosts = getSelectorContentItems('.post-title');
              const postTitleContent = getSelectorContent(post, 'title');
              const postDescriptionContent = getSelectorContent(post, 'description');

              if (!isIn(postTitleContent, uploadedPosts)) {
                const rssPostContainer = document.createElement('a');
                const rssPostTitleContainer = document.createElement('div');
                const rssPostTitleElement = document.createElement('h5');
                const rssPostButtonElement = document.createElement('button');
                const rssPostDescriptionElement = document.createElement('p');

                rssPostContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column');
                rssPostContainer.setAttribute('data-rssId', id);
                rssPostTitleContainer.setAttribute('class', 'd-flex w-100');
                rssPostTitleElement.setAttribute('class', 'mb-1 post-title');
                rssPostButtonElement.setAttribute('class', 'btn btn-primary');
                rssPostButtonElement.setAttribute('data-toggle', 'modal');
                rssPostButtonElement.setAttribute('data-target', '#exampleModal');
                rssPostDescriptionElement.setAttribute('class', 'mb-1 d-none post-description');

                rssPostButtonElement.textContent = 'More';
                rssPostTitleElement.textContent = postTitleContent;
                rssPostDescriptionElement.textContent = postDescriptionContent;

                rssPostTitleContainer.append(rssPostTitleElement);
                rssPostContainer.append(rssPostTitleContainer, rssPostButtonElement, rssPostDescriptionElement);
                postListContainer.append(rssPostContainer);
              }
            });
          };
          const repeat = () => {
            const rssFlowContentList = getSelectorContentItems('.rss-flow', 'data', 'path');
            rssFlowContentList.forEach((path, id) => axios.get(path)
              .then(listeningPath => {
                const listeningXmlContent = getXmlContent(listeningPath);
                const rssPosts = getSelectorItems(listeningXmlContent, 'item');
                addPosts(rssPosts, id);
                const postCon = getSelectorItems(postListContainer, 'a');
                postCon.forEach(el => {
                  el.getAttribute('data-rssid') == state.activeRssId
                  ? el.setAttribute('class', 'list-group-item list-group-item-action flex-column')
                  : el.setAttribute('class', 'd-none');
                })
            }).catch(error => console.log(error)));
          };
          repeat();
          setInterval(repeat, 5000);
        }).catch(error => console.log(error));
      inputRssElement.value = '';
    }
  });

  const submitValue = () => {
    const rssFlowContentList = getSelectorContentItems('.rss-flow', 'data', 'path');
    const submitedPath = buildPath(state.inputValue);
    if (!state.expectedNewValue) {
      if (isIn(submitedPath, rssFlowContentList) || !isURL(state.inputValue)) {
        state.valid = false;
      } else {
        state.expectedNewValue = true;
      //  state.expectedActiveItem = true;
        state.activeRssId = rssListContainter.childNodes.length;
      }
    }
  };

  inputRssElement.addEventListener('input', (e) => {
    state.valid = true;
    state.expectedNewValue = false;
    state.expectedActiveItem = false;
    state.inputValue = e.target.value;
  });

  rssListContainter.addEventListener('click', ({target}) => {
    const targetRssFlow = target.closest('.rss-flow');
    rssListContainter.childNodes.forEach((el, id) => {
      if (el === targetRssFlow) {
        state.activeRssId = id;
        state.expectedActiveItem = true;
      }
    })
  });

  postListContainer.addEventListener('click', ({ target }) => {
    if (target.hasAttribute('data-toggle')) {
      state.expectedModal = true;
      state.expectedNewValue = false;
      state.currentPost = getSelectorContent(target.parentElement, '.post-title');
    }
  });

  modalFadeElement.addEventListener('click', () => {
    state.expectedModal = false;
  });

  submitRssElement.addEventListener('click', submitValue);

  document.addEventListener('keyup', ({ keyCode }) => {
    if (keyCode === 13) {
      submitValue();
    }
    if (keyCode === 27) {
      state.expectedModal = false;
    }
  });
};
