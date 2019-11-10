import { watch } from 'melanke-watchjs';
import { showActivePosts } from './utils';

export const modeWatcher = (state, param, doc) => {
  const alertElement = doc.querySelector('.alert');
  const postListContainer = doc.querySelector('.posts-group');
  const modalBodyElement = doc.querySelector('.modal-body');
  const modalTitleElement = doc.querySelector('.modal-title');

  return watch(state, param, () => {
    const switchingPath = `switchingTo${state.newActiveRssPath}`;
    const modeActions = {
      valid: () => alertElement.setAttribute('class', 'alert alert-danger d-none'),
      invalid: () => {
        alertElement.setAttribute('class', 'alert alert-danger mb-0');
        alertElement.textContent = state.errorMessage;
      },
      [switchingPath]: () => showActivePosts(state.newActiveRssPath, postListContainer, 'div[data-path]'),
      modal: () => {
        const { title, description } = state.modalData;
        modalTitleElement.textContent = title;
        modalBodyElement.textContent = description;
      },
    };
    modeActions[state.mode]();
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
