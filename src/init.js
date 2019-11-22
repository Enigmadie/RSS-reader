import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import i18next from 'i18next';
import { union, differenceBy } from 'lodash';
import { isURL, isIn as isDuplicate } from 'validator';
import translation from './translation';
import {
  modeWatcher,
  feedWatcher,
  postWatcher,
  validationWatcher,
  uploadingFeedWatcher,
} from './watchers';
import {
  getSelectorContent,
  parseRss,
  buildPath,
} from './utils';


export default () => {
  const inputRssElement = document.querySelector('.form-control');
  const formElement = document.querySelector('form');
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
    mode: 'base',
    uploadingFeedProcess: 'watching',
    validationState: 'valid',
    feedsData: [],
    postsData: [],
    paths: [],
    errorType: '',
    inputValue: '',
    modalData: {},
  };

  const updatePathData = (paths) => {
    const lastId = paths.length - 1;
    const defaultDelay = 5000;
    paths.map((path, id) => axios.get(path)
      .then((res) => {
        const rssContent = parseRss(res.data);
        const { posts } = rssContent;
        const newPosts = differenceBy(posts, state.postsData, 'title');
        if (newPosts.length > 0) {
          state.postsData = union(state.postsData, newPosts);
        }
        if (id === lastId) {
          setTimeout(() => updatePathData(state.paths), defaultDelay);
        }
      }).catch(() => {
        state.validationState = 'invalid';
        state.errorType = 'network';
      }));
  };

  modeWatcher(state, 'mode', document);
  validationWatcher(state, ['validationState', 'errorType'], document, i18next);
  feedWatcher(state, 'feedsData', document);
  postWatcher(state, 'postsData', document);
  uploadingFeedWatcher(state, 'uploadingFeedProcess', document);

  inputRssElement.addEventListener('input', ({ target }) => {
    const { paths } = state;
    const targetPath = buildPath(target.value);
    state.inputValue = target.value;
    if (!isURL(target.value)) {
      state.validationState = 'invalid';
      state.errorType = 'invalid';
    } else if (isDuplicate(targetPath, paths)) {
      state.validationState = 'invalid';
      state.errorType = 'duplicate';
    } else {
      state.validationState = 'valid';
    }
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
    state.uploadingFeedProcess = 'uploading';
    e.preventDefault();
    const path = buildPath(state.inputValue);
    axios.get(path).then(({ data }) => {
      state.paths.push(path);
      const currentFeedId = state.feedsData.length;
      const rssContent = parseRss(data, currentFeedId);
      const { title, description, posts } = rssContent;
      state.feedsData.push({
        id: currentFeedId,
        title,
        description,
      });
      state.uploadingFeedProcess = 'watching';
      const newPosts = differenceBy(posts, state.postsData, 'title');
      state.postsData = union(state.postsData, newPosts);
      updatePathData(state.paths);
    }).catch(() => {
      state.validationState = 'invalid';
      state.errorType = 'inaccessible';
    });
  });
};
