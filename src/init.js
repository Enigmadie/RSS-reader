import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import StateMachine from 'javascript-state-machine';
import axios from 'axios';
import { union, differenceBy } from 'lodash';
import {
  modeWatcher,
  feedWatcher,
  postWatcher,
  validationWatcher,
  activePathWathcer,
} from './watchers';
import {
  getSelectorContent,
  parseRss,
  buildPath,
  isValid,
} from './utils';


export default () => {
  const inputRssElement = document.querySelector('.form-control');
  const formElement = document.querySelector('form');
  const rssListContainer = document.querySelector('.rss-flow-group');
  const postListContainer = document.querySelector('.posts-group');
  const modalFadeElement = document.querySelector('.fade');

  const state = {
    mode: 'base',
    validationState: 'valid',
    updateDataProcess: new StateMachine({
      init: 'init',
      transitions: [
        { name: 'upload', from: ['init', 'checked', 'observed'], to: 'uploaded' },
        { name: 'check', from: 'uploaded', to: 'checked' },
        { name: 'error', from: 'uploaded', to: 'observed' },
      ],
    }),
    feedsData: [],
    postsData: [],
    paths: [],
    errorType: '',
    inputValue: '',
    modalData: {},
    activeRssPath: '',
  };

  const updatePathData = (paths) => {
    const lastId = paths.length - 1;
    const defaultDelay = 5000;
    const lostConnectionDelay = 30000;
    state.updateDataProcess.upload();
    paths.map((path, id) => axios.get(path)
      .then((res) => {
        const pathData = state.postsData[id];
        const rssContent = parseRss(res.data);
        const { posts } = rssContent;
        const newPosts = differenceBy(posts, pathData.posts, 'title');
        if (newPosts.length > 0) {
          pathData.posts = union(pathData.posts, newPosts);
          pathData.newPosts = newPosts;
          pathData.hasNewItems = true;
        } else {
          pathData.hasNewItems = false;
          pathData.newPosts = [];
        }
        if (id === lastId) {
          state.updateDataProcess.check();
          setTimeout(() => updatePathData(state.paths), defaultDelay);
        }
      }).catch(() => {
        const hasConnection = navigator.onLine;
        state.validationState = 'invalid';
        if (!hasConnection) {
          state.errorType = 'network';
          setTimeout(() => updatePathData(state.paths), lostConnectionDelay);
        } else {
          state.errorType = 'inaccessibleLater';
        }
      }));
  };

  modeWatcher(state, 'mode', document);
  validationWatcher(state, ['validationState', 'errorType'], document);
  feedWatcher(state, 'feedsData', document);
  postWatcher(state, 'state', document);
  activePathWathcer(state, 'activeRssPath', document);

  inputRssElement.addEventListener('input', ({ target }) => {
    if (!isValid(target.value, state.paths)) {
      state.validationState = 'invalid';
      state.errorType = 'invalid';
    } else {
      state.validationState = 'valid';
      state.inputValue = target.value;
    }
  });

  rssListContainer.addEventListener('click', ({ target }) => {
    const targetRssFlow = target.closest('.rss-flow');
    const targetRssFlowPath = targetRssFlow.dataset.path;
    state.activeRssPath = targetRssFlowPath;
  });

  postListContainer.addEventListener('click', ({ target }) => {
    if (target.hasAttribute('data-toggle')) {
      const targetPostContainer = target.parentElement;
      const targetPostTitle = getSelectorContent(targetPostContainer, '.post-title');
      const targetPostDescription = getSelectorContent(targetPostContainer, '.post-description');
      state.modalData = {
        title: targetPostTitle,
        description: targetPostDescription,
      };
      state.mode = 'modal';
    }
  });

  modalFadeElement.addEventListener('click', () => {
    state.mode = 'base';
  });

  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    const path = buildPath(state.inputValue);
    state.inputValue = '';
    axios.get(path).then(({ data }) => {
      const rssContent = parseRss(data);
      const { title, description, posts } = rssContent;
      state.paths.push(path);
      state.feedsData.push({
        title,
        description,
      });
      state.postsData.push({
        hasNewItems: true,
        posts,
        newPosts: posts,
      });
      if (state.updateDataProcess.state === 'init') {
        updatePathData(state.paths);
      }
    }).catch(() => {
      state.validationState = 'invalid';
      state.errorType = 'inaccessible';
    });
  });
};
