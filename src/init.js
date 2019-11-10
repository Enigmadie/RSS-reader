import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import StateMachine from 'javascript-state-machine';
import axios from 'axios';
import { union, differenceBy } from 'lodash';
import i18next from 'i18next';
import { modeWatcher, feedWatcher, postWatcher } from './watchers';
import translation from './translation';
import {
  getSelectorContent,
  getParsedContent,
  buildPath,
  isValid,
} from './utils';


export default () => {
  const inputRssElement = document.querySelector('.form-control');
  const formElement = document.querySelector('form');
  const rssListContainer = document.querySelector('.rss-flow-group');
  const postListContainer = document.querySelector('.posts-group');
  const modalFadeElement = document.querySelector('.fade');

  i18next.init({
    lng: 'en',
    debug: true,
    resources: {
      en: {
        translation,
      },
    },
  });
  const state = {
    mode: 'valid',
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
    errorMessage: '',
    inputValue: '',
    modalData: {},
    newActiveRssPath: '',
    delay: 5000,
  };

  const updatePathData = (paths) => {
    const lastId = paths.length - 1;
    state.updateDataProcess.upload();
    paths.map((path, id) => axios.get(path)
      .then((res) => {
        const pathData = state.postsData[id];
        const parsedContent = getParsedContent(res.data);
        const { posts } = parsedContent;
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
          setTimeout(() => updatePathData(state.paths), state.delay);
        }
      }).catch(() => {
        const hasConnection = navigator.onLine;
        state.mode = 'invalid';
        if (!hasConnection) {
          state.errorMessage = i18next.t('network');
          state.delay = 30000;
        } else {
          state.errorMessage = i18next.t('inaccessibleLater');
        }
      }));
  };

  modeWatcher(state, ['mode', 'errorMessage'], document);
  feedWatcher(state, 'feedsData', document);
  postWatcher(state, 'state', document);

  inputRssElement.addEventListener('input', ({ target }) => {
    if (!isValid(target.value, state.paths)) {
      state.mode = 'invalid';
      state.errorMessage = i18next.t('invalid');
    } else {
      state.mode = 'valid';
      state.inputValue = target.value;
    }
  });

  rssListContainer.addEventListener('click', ({ target }) => {
    const targetRssFlow = target.closest('.rss-flow');
    const targetRssFlowPath = targetRssFlow.dataset.path;
    state.newActiveRssPath = targetRssFlowPath;
    state.mode = `switchingTo${targetRssFlowPath}`;
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
    state.mode = 'valid';
  });

  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    state.mode = 'valid';
    const path = buildPath(state.inputValue);
    axios.get(path).then(({ data }) => {
      const parsedContent = getParsedContent(data);
      const { title, description, posts } = parsedContent;
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
      state.mode = 'invalid';
      state.errorMessage = i18next.t('inaccessible');
    });
  });
};
