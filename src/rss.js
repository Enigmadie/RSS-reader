import { isURL, isIn } from 'validator';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import {
  getSelectorItems,
  getSelectorContent, getSelectorContentItems,
  parseXmlContent,
  buildPath,
  removeProtocol,
} from './utils';

const domparser = new DOMParser();

export default () => {
  const inputRssElement = document.querySelector('.form-control');
  const alertElement = document.querySelector('.alert');
  const submitRssElement = document.querySelector('.btn');
  const rssListContainer = document.querySelector('.rss-flow-group');
  const postListContainer = document.querySelector('.posts-group');
  const modalFadeElement = document.querySelector('.fade');
  const modalBodyElement = document.querySelector('.modal-body');
  const modalTitleElement = document.querySelector('.modal-title');

  const showActivePosts = (id) => {
    const postsContainers = getSelectorItems(postListContainer, 'div[data-postId]');
    postsContainers.forEach((container) => {
      const containerPostId = container.dataset.postid;
      if (containerPostId === String(id)) {
        container.removeAttribute('class');
      } else {
        container.setAttribute('class', 'd-none');
      }
    });
  };

  const state = {
    mode: 'view',
    inputValue: '',
    modalPostValue: '',
    newActiveRssId: 0,
  };

  watch(state, 'mode', () => {
    const switchPostId = `switchedToRssId${state.newActiveRssId}`;
    const modeActions = {
      view: () => alertElement.setAttribute('class', 'alert alert-danger d-none'),
      invalid: () => alertElement.setAttribute('class', 'alert alert-danger mb-0'),
      [switchPostId]: () => showActivePosts(state.newActiveRssId),
      modal: () => {
        const postTitleList = getSelectorItems(postListContainer, '.post-title');
        postTitleList.forEach((title) => {
          const modalTitleContent = title.textContent;
          if (modalTitleContent === state.modalPostValue) {
            const modalPostDescription = title.parentElement.parentElement;
            const modalBodyContent = getSelectorContent(modalPostDescription, '.post-description');
            modalTitleElement.textContent = modalTitleContent;
            modalBodyElement.textContent = modalBodyContent;
          }
        });
      },
      expectedNewValue: () => {
        const currentPath = buildPath(state.inputValue);
        axios.get(currentPath)
          .then((xmlContent) => {
            const xmlParsedContent = parseXmlContent(domparser, xmlContent);
            const rssFlowContainer = document.createElement('a');
            const rssFlowTitleContainer = document.createElement('div');
            const rssFlowTitleElement = document.createElement('h5');
            const rssFlowDescriptionElement = document.createElement('p');
            const rssFlowBadgeCounter = document.createElement('span');

            const postsContainer = document.createElement('div');
            const rssFlowTitleContent = getSelectorContent(xmlParsedContent, 'title');
            const rssFlowDescriptionContent = getSelectorContent(xmlParsedContent, 'description');

            rssFlowContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
            rssFlowContainer.setAttribute('data-path', state.inputValue);
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
            showActivePosts(state.newActiveRssId);
            const addPosts = (posts, id) => {
              posts.forEach((post) => {
                const postTitleContent = getSelectorContent(post, 'title');
                const postDescriptionContent = getSelectorContent(post, 'description');
                const postsContainers = getSelectorItems(postListContainer, 'div[data-postId]');
                const rssFlowBadges = getSelectorItems(rssListContainer, '.badge');

                postsContainers.forEach((container) => {
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
            const updatePosts = () => {
              const rssFlowContentList = getSelectorContentItems(document, '.rss-flow', 'data', 'path');
              rssFlowContentList.forEach((path, id) => {
                const listeningPath = buildPath(path);
                axios.get(listeningPath).then((listeningXml) => {
                  const listeningXmlContent = parseXmlContent(domparser, listeningXml);
                  const rssPosts = getSelectorItems(listeningXmlContent, 'item');
                  addPosts(rssPosts, id);
                }).catch((error) => console.log(error));
              });
            };
            updatePosts();
            setInterval(updatePosts, 5000);
            inputRssElement.value = '';
          }).catch((error) => {
            alertElement.setAttribute('class', 'alert alert-danger mb-0');
            console.log(error);
          });
      },
    };
    modeActions[state.mode]();
  });

  const submitValue = () => {
    const rssFlowContentList = getSelectorContentItems(document, '.rss-flow', 'data', 'path');
    const rssListContainerLength = rssListContainer.childNodes.length;
    state.inputValue = removeProtocol(state.inputValue);
    if (isIn(state.inputValue, rssFlowContentList) || !isURL(state.inputValue)) {
      state.mode = 'invalid';
    } else {
      state.mode = 'expectedNewValue';
      state.newActiveRssId = rssListContainerLength;
    }
  };

  inputRssElement.addEventListener('input', (e) => {
    state.mode = 'view';
    state.inputValue = e.target.value;
  });

  rssListContainer.addEventListener('click', ({ target }) => {
    const targetRssFlow = target.closest('.rss-flow');
    const rssListContainerItems = rssListContainer.childNodes;
    rssListContainerItems.forEach((el, id) => {
      if (el === targetRssFlow) {
        state.newActiveRssId = id;
        state.mode = `switchedToRssId${id}`;
      }
    });
  });

  postListContainer.addEventListener('click', ({ target }) => {
    if (target.hasAttribute('data-toggle')) {
      state.mode = 'modal';
      const targetRssFlowElement = target.parentElement;
      state.modalPostValue = getSelectorContent(targetRssFlowElement, '.post-title');
    }
  });

  modalFadeElement.addEventListener('click', () => {
    state.mode = 'view';
  });

  submitRssElement.addEventListener('click', submitValue);

  document.addEventListener('keyup', ({ keyCode }) => {
    if (keyCode === 13) {
      submitValue();
    }
    if (keyCode === 27) {
      state.mode = 'view';
    }
  });
};
