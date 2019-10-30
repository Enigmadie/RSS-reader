import '@babel/polyfill';
import 'bootstrap/js/dist/modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import StateMachine from 'javascript-state-machine';
import axios from 'axios';
import { union, includes } from 'lodash';
import { modeWatcher, rssWatcher } from './watchers';
import {
  getSelectorContent,
  getParsedData,
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
    rssData: [],
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
        const pathData = state.rssData[id];
        const xmlContent = getParsedData(res.data);
        const xmlItems = xmlContent.querySelectorAll('item');
        const posts = getPostsData(xmlItems, 'title', 'description');
        const oldPostsTitle = pathData.posts.map((el) => el.title);
        const newPosts = posts.filter((post) => !includes(oldPostsTitle, post.title));
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
          const currentPaths = state.rssData.map((el) => el.path);
          setTimeout(() => updatePathData(currentPaths), state.delay);
        }
      }).catch((e) => console.log(e)));
  };

  modeWatcher(state, ['mode', 'errorMessage'], document);
  rssWatcher(state, 'state', document);

  inputRssElement.addEventListener('input', ({ target }) => {
    const paths = state.rssData.map((el) => el.path);
    if (!isValid(target.value, paths)) {
      state.mode = 'invalid';
      state.errorMessage = 'Please provide a valid address';
    } else {
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
      const xmlContent = getParsedData(data);
      const xmlItems = xmlContent.querySelectorAll('item');
      const title = getSelectorContent(xmlContent, 'title');
      const description = getSelectorContent(xmlContent, 'description');
      const posts = getPostsData(xmlItems, 'title', 'description');
      state.rssData.push({
        hasNewItems: true,
        path,
        title,
        description,
        posts,
        newPosts: posts,
      });
      if (state.updateDataProcess.state === 'init') {
        const paths = state.rssData.map((el) => el.path);
        updatePathData(paths);
      }
    }).catch((err) => {
      const hasConnection = navigator.onLine;
      state.mode = 'invalid';
      if (!hasConnection) {
        state.errorMessage = 'Your device lost its internet connection';
        state.delay = 30000;
      } else {
        state.errorMessage = 'The address is currently inaccessible';
      }
      console.log(err);
    });
  });
};
