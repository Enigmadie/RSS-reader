export const getSelectorContentItems = (el, selector, prop = 'textContent', dataProp = null) => Array.prototype
  .slice
  .call(el.querySelectorAll(selector))
  .map(item => ((prop === 'data') ? item.dataset[dataProp] : item[prop]));

export const getSelectorContent = (el, selector, prop = 'textContent') => el.querySelector(selector)[prop];

export const getSelectorItems = (el, selector) => el.querySelectorAll(selector);

export const getXmlContent = (parser, xmlFile) => parser.parseFromString(xmlFile.request.responseText, 'text/xml');

export const buildPath = path => `https://cors-anywhere.herokuapp.com/${path}`;
