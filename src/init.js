import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import StateMachine from 'javascript-state-machine';
import axios from 'axios';
import { union, differenceBy } from 'lodash';
import i18next from 'i18next';
import { modeWatcher, feedWatcher, postWatcher } from './watchers';
import {
  getSelectorContent,
  getXmlContent,
  buildPath,
  isValid,
  getPostsData,
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
        translation: {
          inaccessible: 'The address is inaccessible',
          inaccessibleLater: 'One or more addresses became inaccessible',
          network: 'Your device lost its internet connection',
          invalid: 'The address is not valid',
        },
      },
    },
  });
  const state = {
    mode: 'view',
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
    errorMessage: '',
    inputValue: '',
    modalElement: null,
    newActiveRssPath: '',
    delay: 5000,
  };

  const updatePathData = (paths) => {
    const lastId = paths.length - 1;
    state.updateDataProcess.upload();
    paths.map((path, id) => axios.get(path)
      .then((res) => {
        const pathData = state.postsData[id];
        const xmlContent = getXmlContent(res.data);
        const xmlItems = xmlContent.querySelectorAll('item');
        const posts = getPostsData(xmlItems, 'title', 'description');
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
          const currentPaths = state.postsData.map((el) => el.path);
          setTimeout(() => updatePathData(currentPaths), state.delay);
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
    const paths = state.postsData.map((el) => el.path);
    if (!isValid(target.value, paths)) {
      state.mode = 'invalid';
      state.errorMessage = i18next.t('invalid');
    } else {
      state.mode = 'view';
      state.inputValue = target.value;
    }
  });

  rssListContainer.addEventListener('click', ({ target }) => {
    const targetRssFlow = target.closest('.rss-flow');
    const targetRssFlowPath = targetRssFlow.dataset.path;
    state.newActiveRssPath = targetRssFlowPath;
    state.mode = `switchedToRssId${targetRssFlowPath}`;
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

  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    state.mode = 'view';
    const path = buildPath(state.inputValue);
    axios.get(path).then(({ data }) => {
      const xmlContent = getXmlContent(data);
      const xmlItems = xmlContent.querySelectorAll('item');
      const title = getSelectorContent(xmlContent, 'title');
      const description = getSelectorContent(xmlContent, 'description');
      const posts = getPostsData(xmlItems, 'title', 'description');
      state.feedsData.push({
        path,
        title,
        description,
      });
      state.postsData.push({
        hasNewItems: true,
        path,
        posts,
        newPosts: posts,
      });
      if (state.updateDataProcess.state === 'init') {
        const paths = state.postsData.map((el) => el.path);
        updatePathData(paths);
      }
    }).catch(() => {
      state.mode = 'invalid';
      state.errorMessage = i18next.t('inaccessible');
    });
  });
};
