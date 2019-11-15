import { watch } from 'melanke-watchjs';
import i18next from 'i18next';
import translation from './translation';
import { showActivePosts } from './utils';

export const activePathWathcer = (state, param, doc) => {
  const postListContainer = doc.querySelector('.posts-group');
  return watch(state, param, () => {
    showActivePosts(state.activeRssPath, postListContainer, 'div[data-path]');
  });
};

export const modeWatcher = (state, param, doc) => {
  const modalBodyElement = doc.querySelector('.modal-body');
  const modalTitleElement = doc.querySelector('.modal-title');
  return watch(state, param, () => {
    if (state.mode === 'modal') {
      const { title, description } = state.modalData;
      modalTitleElement.textContent = title;
      modalBodyElement.textContent = description;
    }
  });
};

export const validationWatcher = (state, param, doc) => {
  const alertElement = doc.querySelector('.alert');
  const submitElement = doc.querySelector('.btn-news');
  i18next.init({
    lng: 'en',
    debug: true,
    resources: {
      en: {
        translation,
      },
    },
  });
  return watch(state, param, () => {
    const errorMessage = i18next.t(state.errorType);
    const validationActions = {
      valid: () => {
        alertElement.setAttribute('class', 'alert alert-danger d-none');
        submitElement.removeAttribute('disabled');
      },
      invalid: () => {
        alertElement.setAttribute('class', 'alert alert-danger mb-0');
        alertElement.textContent = errorMessage;
        submitElement.setAttribute('disabled', '');
      },
    };
    validationActions[state.validationState]();
  });
};

export const feedWatcher = (state, param, doc) => {
  const rssListContainer = doc.querySelector('.rss-flow-group');
  const postListContainer = doc.querySelector('.posts-group');
  const inputRssElement = doc.querySelector('.form-control');
  const { feedsData, paths } = state;
  watch(state, param, () => {
    const lastId = feedsData.length - 1;
    const newFeed = feedsData[lastId];
    const newPath = paths[lastId];
    const { title, description } = newFeed;
    const rssFlowContainer = doc.createElement('a');
    const postsContainer = doc.createElement('div');

    rssFlowContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
    rssFlowContainer.setAttribute('data-path', newPath);
    postsContainer.setAttribute('data-path', newPath);

    rssListContainer.append(rssFlowContainer);
    postListContainer.append(postsContainer);

    rssFlowContainer.innerHTML = `<div class="d-flex w100">
        <h5 class="mb-1">${title}</h5>
        <span class="badge badge-light"></span>
      </div>
      <p class="mb-1">${description}</p>`;
    showActivePosts(newPath, postListContainer, 'div[data-path]');
    inputRssElement.value = '';
  });
};

export const postWatcher = (state, param, doc) => {
  const updateState = state.updateDataProcess;
  const rssListContainer = doc.querySelector('.rss-flow-group');
  const postListContainer = doc.querySelector('.posts-group');
  watch(updateState, param, () => {
    if (updateState.state === 'uploaded') {
      state.postsData.forEach(({ hasNewItems, posts, newPosts }, id) => {
        if (hasNewItems) {
          newPosts.forEach(({ title, description }) => {
            const currentPostsContainer = postListContainer.childNodes[id];
            const currentRssFlowContainer = rssListContainer.childNodes[id];
            const rssFlowBadge = currentRssFlowContainer.querySelector('.badge');
            const postBlock = doc.createElement('a');
            postBlock.setAttribute('class', 'list-group-item list-group-item-action flex-column');
            currentPostsContainer.append(postBlock);
            const containerLength = posts.length;
            rssFlowBadge.textContent = containerLength;

            postBlock.innerHTML = `<div class="d-flex w-100">
                <h5 class="mb-1 post-title">${title}</h5>
              </div>
              <button class="btn btn-primary" data-toggle="modal" data-target="#rssModal">More</button>
              <p class="mb-1 d-none post-description">${description}</p>`;
          });
        }
      });
    }
  });
};
