import { isURL, isIn } from 'validator';

export const getSelectorContentItems = (el, selector, prop = 'textContent', dataProp = null) => Array.prototype
  .slice
  .call(el.querySelectorAll(selector))
  .map((item) => ((prop === 'data') ? item.dataset[dataProp] : item[prop]));

export const getSelectorByAttr = (el, selector, attr, dataProp = null) => {
  const selectorItems = el.querySelectorAll(selector);
  let result = null;
  selectorItems.forEach((item) => {
    const currentAttr = dataProp === null
      ? item.getAttribute(selector)
      : item.dataset[dataProp];
    if (currentAttr === attr) {
      result = item;
    }
  });
  return result;
};

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

export const getParsedData = (data) => {
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
