import { isURL, isIn } from 'validator';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import {
  getSelectorItems, getSelectorContent, getSelectorContentItems, getXmlContent, buildPath,
} from './utils';

const domparser = new DOMParser();
const inputRssElement = document.querySelector('.form-control');
const alertElement = document.querySelector('.alert');
const submitRssElement = document.querySelector('.btn');
const rssListContainer = document.querySelector('.rss-flow-group');
const postListContainer = document.querySelector('.posts-group');
const modalFadeElement = document.querySelector('.fade');
const modalBodyElement = document.querySelector('.modal-body');
const modalTitleElement = document.querySelector('.modal-title');

export default () => {
  const state = {
    expectedNewValue: false,
    expectedModal: false,
    valid: true,
    inputValue: '',
    modalPostValue: '',
    newActiveRssId: 0,
    swithcedRssId: 0,
  };

  watch(state, ['expectedNewValue', 'expectedModal', 'valid', 'swithcedRssId'], () => {
    alertElement.setAttribute('class', 'alert alert-danger d-none');
    if (!state.valid) {
      alertElement.setAttribute('class', 'alert alert-danger mb-0');
    }
    const showActiveItems = id => {
      const postsContainers = getSelectorItems(postListContainer, 'div[data-postId]');
      postsContainers.forEach(container => {
        const containerPostId = container.dataset.postid;
        if (containerPostId === String(id)) {
          container.removeAttribute('class');
        } else {
          container.setAttribute('class', 'd-none');
        }
      });
    };
    showActiveItems(state.newActiveRssId);
    if (state.expectedModal) {
      const postTitleList = getSelectorItems(postListContainer, '.post-title');
      postTitleList.forEach(title => {
        const modalTitleContent = title.textContent;
        if (modalTitleContent === state.modalPostValue) {
          const modalPostDescription = title.parentElement.parentElement;
          const modalBodyContent = getSelectorContent(modalPostDescription, '.post-description');
          modalTitleElement.textContent = modalTitleContent;
          modalBodyElement.textContent = modalBodyContent;
        }
      });
    }
    if (state.expectedNewValue) {
      const currentPath = buildPath(state.inputValue);
      axios.get(currentPath)
        .then(xmlFile => {
          const xmlContent = getXmlContent(domparser, xmlFile);
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
          postsContainer.setAttribute('data-postid', `${state.newActiveRssId}`);
          rssFlowTitleContainer.setAttribute('class', 'd-flex w-100');
          rssFlowTitleElement.setAttribute('class', 'mb-1');
          rssFlowDescriptionElement.setAttribute('class', 'mb-1');
          rssFlowBadgeCounter.setAttribute('class', 'badge badge-light');

          rssFlowTitleElement.textContent = rssFlowTitleContent;
          rssFlowDescriptionElement.textContent = rssFlowDescriptionContent;

          rssFlowTitleContainer.append(rssFlowTitleElement, rssFlowBadgeCounter);
          rssFlowContainer.append(rssFlowTitleContainer, rssFlowDescriptionElement);
          rssListContainer.append(rssFlowContainer);
          postListContainer.append(postsContainer);
          showActiveItems(state.newActiveRssId);
          const addPosts = (posts, id) => {
            posts.forEach(post => {
              const postTitleContent = getSelectorContent(post, 'title');
              const postDescriptionContent = getSelectorContent(post, 'description');
              const postsContainers = getSelectorItems(postListContainer, 'div[data-postId]');
              const rssFlowBadges = getSelectorItems(rssListContainer, '.badge');

              postsContainers.forEach(container => {
                const containerPostId = container.dataset.postid;
                if (containerPostId === String(id)) {
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
                    rssPostButtonElement.setAttribute('data-target', '#rssModal');
                    rssPostDescriptionElement.setAttribute('class', 'mb-1 d-none post-description');

                    rssPostButtonElement.textContent = 'More';
                    rssPostTitleElement.textContent = postTitleContent;
                    rssPostDescriptionElement.textContent = postDescriptionContent;

                    rssPostTitleContainer.append(rssPostTitleElement);
                    rssPostContainer.append(rssPostTitleContainer, rssPostButtonElement);
                    rssPostContainer.append(rssPostDescriptionElement);
                    container.append(rssPostContainer);
                    const containerLength = container.childNodes.length;
                    const rssFlowBadgeId = rssFlowBadges[id];
                    rssFlowBadgeId.textContent = containerLength;
                  }
                }
              });
            });
          };
          const repeat = () => {
            const rssFlowContentList = getSelectorContentItems(document, '.rss-flow', 'data', 'path');
            rssFlowContentList.forEach((path, id) => axios.get(path)
              .then(listeningPath => {
                const listeningXmlContent = getXmlContent(domparser, listeningPath);
                const rssPosts = getSelectorItems(listeningXmlContent, 'item');
                addPosts(rssPosts, id);
              }).catch(error => console.log(error)));
          };
          repeat();
          setInterval(repeat, 5000);
          inputRssElement.value = '';
        }).catch(error => {
          showActiveItems(rssListContainer.childNodes.length - 1);
          alertElement.setAttribute('class', 'alert alert-danger mb-0')
          console.log(error)
        });
    }
  });

  const submitValue = () => {
    const rssFlowContentList = getSelectorContentItems(document, '.rss-flow', 'data', 'path');
    const rssListContainerLength = rssListContainer.childNodes.length;
    const submitedPath = buildPath(state.inputValue);
    if (!state.expectedNewValue) {
      if (isIn(submitedPath, rssFlowContentList) || !isURL(state.inputValue)) {
        state.valid = false;
      } else {
        state.expectedNewValue = true;
        state.newActiveRssId = rssListContainerLength;
      }
    }
  };

  inputRssElement.addEventListener('input', e => {
    state.valid = true;
    state.expectedNewValue = false;
    state.inputValue = e.target.value;
  });

  rssListContainer.addEventListener('click', ({ target }) => {
    const targetRssFlow = target.closest('.rss-flow');
    const rssListContainerItems = rssListContainer.childNodes;
    rssListContainerItems.forEach((el, id) => {
      if (el === targetRssFlow) {
        state.newActiveRssId = id;
        state.switchedRssId = state.newActiveRssId;
        state.expectedNewValue = false;
      }
    });
  });

  postListContainer.addEventListener('click', ({ target }) => {
    if (target.hasAttribute('data-toggle')) {
      state.expectedModal = true;
      state.expectedNewValue = false;
      const targetRssFlowElement = target.parentElement;
      state.modalPostValue = getSelectorContent(targetRssFlowElement, '.post-title');
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
