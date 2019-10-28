import { isURL, isIn } from 'validator';

export const getSelectorContentItems = (el, selector, prop = 'textContent', dataProp = null) => Array.prototype
  .slice
  .call(el.querySelectorAll(selector))
  .map((item) => ((prop === 'data') ? item.dataset[dataProp] : item[prop]));

export const getSelectorContent = (el, selector, prop = 'textContent') => el.querySelector(selector)[prop];

export const getSelectorItems = (el, selector) => el.querySelectorAll(selector);

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
