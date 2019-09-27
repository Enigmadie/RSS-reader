import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
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

const getSelectorContentItems = (el, selector, prop = 'textContent', dataProp = null) => Array.prototype
  .slice
  .call(el.querySelectorAll(selector))
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

  watch(state, ['expectedNewValue', 'expectedModal', 'valid', 'expectedActiveItem'], () => {
    inputRssElement.setAttribute('class', 'form-control');
    const showActiveItems = (id) => {
      const postsContainers = getSelectorItems(postListContainer, 'div[data-postId]');
      postsContainers.forEach(container => {
        if (container.dataset.postid == id) {
          container.removeAttribute('class');
        } else {
          container.setAttribute('class', 'd-none');
        }
      })
    }
    showActiveItems(state.activeRssId);
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
          const rssFlowBadgeCounter = document.createElement('span');

          const postsContainer = document.createElement('div');
          const rssFlowTitleContent = getSelectorContent(xmlContent, 'title');
          const rssFlowDescriptionContent = getSelectorContent(xmlContent, 'description');

          rssFlowContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
          rssFlowContainer.setAttribute('data-path', currentPath);
          postsContainer.setAttribute('class', 'd-none');
          postsContainer.setAttribute('data-postid', `${state.activeRssId}`);
          rssFlowTitleContainer.setAttribute('class', 'd-flex w-100');
          rssFlowTitleElement.setAttribute('class', 'mb-1');
          rssFlowDescriptionElement.setAttribute('class', 'mb-1');
          rssFlowBadgeCounter.setAttribute('class', 'badge badge-light');

          rssFlowTitleElement.textContent = rssFlowTitleContent;
          rssFlowDescriptionElement.textContent = rssFlowDescriptionContent;

          rssFlowTitleContainer.append(rssFlowTitleElement, rssFlowBadgeCounter);
          rssFlowContainer.append(rssFlowTitleContainer, rssFlowDescriptionElement);
          rssListContainter.append(rssFlowContainer);
          postListContainer.append(postsContainer);
          showActiveItems(state.activeRssId);
          const addPosts = (posts, id) => {
            posts.forEach(post => {
              const postTitleContent = getSelectorContent(post, 'title');
              const postDescriptionContent = getSelectorContent(post, 'description');
              const postsContainers = getSelectorItems(postListContainer, 'div[data-postId]');
              const rssFlowBadges = getSelectorItems(rssListContainter, '.badge');
              postsContainers.forEach(container => {
                if (container.dataset.postid == id) {
                  const containerTitlesContent = getSelectorContentItems(container, '.post-title');
                  if (!isIn(postTitleContent, containerTitlesContent)) {
                    const rssPostContainer = document.createElement('a');
                    const rssPostTitleContainer = document.createElement('div');
                    const rssPostTitleElement = document.createElement('h5');
                    const rssPostButtonElement = document.createElement('button');
                    const rssPostDescriptionElement = document.createElement('p');

                    rssPostContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column');
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
                    container.append(rssPostContainer);
                    const containerLength = container.childNodes.length;
                    rssFlowBadges[id].textContent = containerLength;
                  }
                }
              })
            });
          };
          const repeat = () => {
            const rssFlowContentList = getSelectorContentItems(document, '.rss-flow', 'data', 'path');
            rssFlowContentList.forEach((path, id) => axios.get(path)
              .then(listeningPath => {
                const listeningXmlContent = getXmlContent(listeningPath);
                const rssPosts = getSelectorItems(listeningXmlContent, 'item');
                addPosts(rssPosts, id);
              }).catch(error => console.log(error)));
          };
          repeat();
          setInterval(repeat, 5000);
          inputRssElement.value = '';
        }).catch(error => console.log(error));
    }
  });

  const submitValue = () => {
    const rssFlowContentList = getSelectorContentItems(document, '.rss-flow', 'data', 'path');
    const submitedPath = buildPath(state.inputValue);
    if (!state.expectedNewValue) {
      if (isIn(submitedPath, rssFlowContentList) || !isURL(state.inputValue)) {
        state.valid = false;
      } else {
        state.expectedNewValue = true;
        state.activeRssId = rssListContainter.childNodes.length;
      }
    }
  };

  inputRssElement.addEventListener('input', (e) => {
    state.valid = true;
    state.expectedNewValue = false;
    // state.expectedActiveItem = false;
    state.inputValue = e.target.value;
  });

  rssListContainter.addEventListener('click', ({target}) => {
    const targetRssFlow = target.closest('.rss-flow');
    rssListContainter.childNodes.forEach((el, id) => {
      if (el === targetRssFlow) {
        state.activeRssId = id;
        state.expectedActiveItem = id;
        state.expectedNewValue = false;
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
