import { isURL, isIn } from 'validator';

export const getSelectorContent = (el, selector, prop = 'textContent') => el.querySelector(selector)[prop];

export const getPostsData = (el, firstSelector, secondSelector) => {
  const result = [];
  el.forEach((item) => {
    const firstSelectorData = getSelectorContent(item, firstSelector);
    const secondSelectorData = getSelectorContent(item, secondSelector);
    result.push({
      [firstSelector]: firstSelectorData,
      [secondSelector]: secondSelectorData,
    });
  });
  return result;
};

export const getXmlContent = (data) => {
  const domparser = new DOMParser();
  return domparser.parseFromString(data, 'text/xml');
};

export const buildPath = (path) => `https://cors-anywhere.herokuapp.com/${path}`;

export const isValid = (value, coll) => (!isIn(value, coll) && isURL(value));

export const showActivePosts = (path, el, param) => {
  const postsContainers = el.querySelectorAll(param);
  postsContainers.forEach((container) => {
    const containerPostPath = container.dataset.path;
    if (containerPostPath === path) {
      container.removeAttribute('class');
    } else {
      container.setAttribute('class', 'd-none');
    }
  });
};
