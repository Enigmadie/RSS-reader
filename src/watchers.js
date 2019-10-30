import { watch } from 'melanke-watchjs';
import { isIn } from 'validator';
import {
  showActivePosts,
  getSelectorContent,
  getSelectorContentItems,
  getSelectorByAttr,
} from './utils';

export const modeWatcher = (state, param, doc) => {
  const alertElement = doc.querySelector('.alert');
  const postListContainer = doc.querySelector('.posts-group');
  const modalBodyElement = doc.querySelector('.modal-body');
  const modalTitleElement = doc.querySelector('.modal-title');

  return watch(state, param, () => {
    const switchPostId = `switchedToRssId${state.newActiveRssPath}`;
    const modeActions = {
      view: () => alertElement.setAttribute('class', 'alert alert-danger d-none'),
      invalid: () => {
        alertElement.setAttribute('class', 'alert alert-danger mb-0');
        alertElement.textContent = state.errorMessage;
      },
      [switchPostId]: () => showActivePosts(state.newActiveRssPath, postListContainer, 'div[data-path]'),
      modal: () => {
        const modalTitleContent = getSelectorContent(state.modalElement, '.post-title');
        const modalBodyContent = getSelectorContent(state.modalElement, '.post-description');
        modalTitleElement.textContent = modalTitleContent;
        modalBodyElement.textContent = modalBodyContent;
      },
    };
    modeActions[state.mode]();
  });
};

export const rssWatcher = (state, param, doc) => {
  const rssListContainer = doc.querySelector('.rss-flow-group');
  const postListContainer = doc.querySelector('.posts-group');
  const inputRssElement = doc.querySelector('.form-control');

  watch(state.updateDataProcess, param, () => {
    if (state.updateDataProcess[param] === 'uploaded') {
      const rssPathList = getSelectorContentItems(doc, '.rss-flow', 'data', 'path');
      state.rssData.forEach(({
        path,
        title,
        description,
        hasNewItems,
        posts,
        newPosts,
      }) => {
        const hasNewRss = !isIn(path, rssPathList);
        if (hasNewRss) {
          const rssFlowContainer = doc.createElement('a');
          const postsContainer = doc.createElement('div');

          rssFlowContainer.setAttribute('class', 'list-group-item list-group-item-action flex-column rss-flow');
          rssFlowContainer.setAttribute('data-path', path);
          postsContainer.setAttribute('data-path', path);

          rssListContainer.append(rssFlowContainer);
          postListContainer.append(postsContainer);

          rssFlowContainer.innerHTML = `<div class="d-flex w100">
              <h5 class="mb-1">${title}</h5>
              <span class="badge badge-light"></span>
            </div>
            <p class="mb-1">${description}</p>`;
          showActivePosts(path, postListContainer, 'div[data-path]');
          inputRssElement.value = '';
        }
        if (hasNewItems) {
          newPosts.forEach((post) => {
            const currentPostsContainer = getSelectorByAttr(postListContainer, 'div[data-path]', path, 'path');
            const currentRssFlowContainer = getSelectorByAttr(rssListContainer, 'a[data-path]', path, 'path');
            const rssFlowBadge = currentRssFlowContainer.querySelector('.badge');
            const postBlock = doc.createElement('a');
            postBlock.setAttribute('class', 'list-group-item list-group-item-action flex-column');
            currentPostsContainer.append(postBlock);
            const containerLength = posts.length;
            rssFlowBadge.textContent = containerLength;

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
};
