import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import StateMachine from 'javascript-state-machine';
import { isIn } from 'validator';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import {
  getSelectorItems,
  getSelectorContent,
  getSelectorContentItems,
  getParsedData,
  buildPath,
  isValid,
  getPostsData,
} from './utils';


export default () => {
  const inputRssElement = document.querySelector('.form-control');
  const alertElement = document.querySelector('.alert');
  const submitRssElement = document.querySelector('.btn-read');
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
    process: new StateMachine({
      init: 'init',
      transitions: [
        { name: 'upload', from: ['init', 'checked'], to: 'uploaded' },
        { name: 'check', from: 'uploaded', to: 'checked' },
        { name: 'error', from: ['init', 'uploaded'], to: 'observed' },
      ],
    }),
    contentItems: [],
    rssFlowPaths: [],
    inputValue: '',
    modalElement: null,
    newActiveRssId: 0,
  };

  watch(state, 'mode', () => {
    const switchPostId = `switchedToRssId${state.newActiveRssId}`;
    const modeActions = {
      view: () => alertElement.setAttribute('class', 'alert alert-danger d-none'),
      invalid: () => alertElement.setAttribute('class', 'alert alert-danger mb-0'),
      [switchPostId]: () => showActivePosts(state.newActiveRssId),
      modal: () => {
        const modalTitleContent = getSelectorContent(state.modalElement, '.post-title');
        const modalBodyContent = getSelectorContent(state.modalElement, '.post-description');
        modalTitleElement.textContent = modalTitleContent;
        modalBodyElement.textContent = modalBodyContent;
      },
    };
    modeActions[state.mode]();
  });

  watch(state.process, 'state', () => {
    if (state.process.state === 'checked') {
      const rssPathList = getSelectorContentItems(document, '.rss-flow', 'data', 'path');
      state.contentItems.forEach(({
        status,
        title,
        description,
        posts,
        newPosts,
      }, id) => {
        const currentRssPath = state.rssFlowPaths[id];
        const isAccessiblePath = status === 'accessible';
        const expectedNewRss = !isIn(currentRssPath, rssPathList);
        const expectedNewPosts = newPosts.length > 0;

        if (expectedNewRss) {
          const rssFlowContainer = document.createElement('a');
          const postsContainer = document.createElement('div');

          rssFlowContainer.setAttribute('class', 'rss-flow d-none');
          rssFlowContainer.setAttribute('data-path', currentRssPath);
          rssFlowContainer.setAttribute('data-rssid', id);
          postsContainer.setAttribute('class', 'd-none');
          postsContainer.setAttribute('data-postid', id);

          rssListContainer.append(rssFlowContainer);
          postListContainer.append(postsContainer);

          rssFlowContainer.innerHTML = `<div class="d-flex w100">
              <h5 class="mb-1">${title}</h5>
              <span class="badge badge-light"></span>
            </div>
            <p class="mb-1">${description}</p>`;
          if (isAccessiblePath) {
            showActivePosts(state.newActiveRssId);
            inputRssElement.value = '';
          }
        }

        if (isAccessiblePath) {
          const rssContainers = getSelectorItems(rssListContainer, 'a[data-rssid]');
          rssContainers[id].setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
          const rssFlowBadges = getSelectorItems(rssListContainer, '.badge');
          rssFlowBadges[id].textContent = posts.length;
        }

        if (expectedNewPosts) {
          newPosts.forEach((post) => {
            const postsContainers = getSelectorItems(postListContainer, 'div[data-postId]');
            const currentPostsContainer = postsContainers[id];
            const postBlock = document.createElement('a');
            postBlock.setAttribute('class', 'list-group-item list-group-item-action flex-column');
            currentPostsContainer.append(postBlock);

            postBlock.innerHTML = `<div class="d-flex w-100">
              <h5 class="mb-1 post-title">${post.title}</h5>
            </div>
            <button class="btn btn-primary" data-toggle="modal" data-target="#rssModal">More</button>
            <p class="mb-1 d-none post-description">${post.description}</p>`;
          });
        }
      });
    }
  });

  inputRssElement.addEventListener('input', (e) => {
    state.inputValue = e.target.value;
  });

  rssListContainer.addEventListener('click', ({ target }) => {
    const targetRssFlow = target.closest('.rss-flow');
    const targetRssFlowId = Number(targetRssFlow.dataset.rssid);
    state.newActiveRssId = targetRssFlowId;
    state.mode = `switchedToRssId${targetRssFlowId}`;
  });

  postListContainer.addEventListener('click', ({ target }) => {
    if (target.hasAttribute('data-toggle')) {
      const targetPostContainer = target.parentElement;
      state.modalElement = targetPostContainer;
      state.mode = 'modal';
    }
  });

  modalFadeElement.addEventListener('click', () => {
    state.mode = 'view';
  });

  submitRssElement.addEventListener('click', () => {
    if (!isValid(state.inputValue, state.rssFlowPaths)) {
      state.mode = 'invalid';
    } else {
      state.mode = 'view';
      state.newActiveRssId = state.rssFlowPaths.length;
      state.rssFlowPaths.push(state.inputValue);
      state.contentItems.push('expectedValue');
      const repeat = (paths) => {
        state.process.upload();
        const pathPromises = paths.map((path) => axios.get(buildPath(path))
          .then((v) => ({ result: 'success', value: v }))
          .catch((e) => ({ result: 'error', error: e })));
        const promise = Promise.all(pathPromises);
        promise.then((responses) => {
          responses.map((res, id) => {
            const currentContentItem = state.contentItems[id];
            const { status } = currentContentItem;
            const isNew = currentContentItem === 'expectedValue';
            const isNowAccessible = status === 'inaccessible';

            const responseActions = {
              success: () => {
                const xmlContent = getParsedData(res.value.data);
                const xmlItems = getSelectorItems(xmlContent, 'item');
                const title = getSelectorContent(xmlContent, 'title');
                const description = getSelectorContent(xmlContent, 'description');
                const postsData = getPostsData(xmlItems, 'title', 'description');
                if (isNew || isNowAccessible) {
                  state.contentItems[id] = {
                    status: 'accessible',
                    title,
                    description,
                    posts: postsData,
                    newPosts: postsData,
                  };
                } else {
                  currentContentItem.newPosts = [];
                  const { newPosts, posts } = currentContentItem;
                  const oldPostsTitles = posts.map((post) => post.title);
                  postsData.forEach((post) => {
                    if (!isIn(post.title, oldPostsTitles)) {
                      newPosts.push(post);
                      posts.push(post);
                    }
                  });
                }
              },
              error: () => {
                if (isNew) {
                  state.mode = 'invalid';
                  state.contentItems[id] = {
                    status: 'inaccessible',
                    title: '',
                    description: '',
                    posts: [],
                    newPosts: [],
                  };
                } else {
                  state.contentItems[id].status = 'inaccessible';
                }
              },
            };
            return responseActions[res.result]();
          });
        }).then(() => {
          state.process.check();
          return setTimeout(() => repeat(state.rssFlowPaths), 5000);
        });
      };
      repeat(state.rssFlowPaths);
    }
  });
};
