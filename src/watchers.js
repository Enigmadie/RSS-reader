import { watch } from 'melanke-watchjs';

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

export const validationWatcher = (state, param, doc, msgStorage) => {
  const alertElement = doc.querySelector('.alert');
  const submitElement = doc.querySelector('.btn-news');
  return watch(state, param, () => {
    const errorMessage = msgStorage.t(state.errorType);
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

export const uploadingFeedWatcher = (state, param, doc) => {
  const submitElement = doc.querySelector('.btn-news');
  return watch(state, param, () => {
    const uploadingFeedActions = {
      uploading: () => submitElement.setAttribute('disabled', ''),
      watching: () => submitElement.removeAttribute('disabled'),
    };
    uploadingFeedActions[state.uploadingFeedProcess]();
  });
};

export const feedWatcher = (state, param, doc) => {
  const rssListContainer = doc.querySelector('.rss-flow-group');
  const inputRssElement = doc.querySelector('.form-control');
  const { feedsData } = state;
  watch(state, param, () => {
    const lastId = feedsData.length - 1;
    const newFeed = feedsData[lastId];
    const { title, description } = newFeed;
    const rssFlowContainer = doc.createElement('a');

    rssFlowContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
    rssListContainer.append(rssFlowContainer);
    rssFlowContainer.innerHTML = `<div class="d-flex w100">
        <h5 class="mb-1">${title}</h5>
        <span class="badge badge-light"></span>
      </div>
      <p class="mb-1">${description}</p>`;
    inputRssElement.value = '';
  });
};

export const postWatcher = (state, param, doc) => {
  const postListContainer = doc.querySelector('.posts-group');
  watch(state, param, () => {
    const renderedPosts = state.postsData.map(({ title, description }) => `<a class="list-group-item list-group-item-action flex-column"><div class="d-flex w-100">
            <h5 class="mb-1 post-title">${title}</h5>
          </div>
          <button class="btn btn-primary" data-toggle="modal" data-target="#rssModal">More</button>
          <p class="mb-1 d-none post-description">${description}</p>
        </a>`).join('');
    postListContainer.innerHTML = renderedPosts;
  });
};
