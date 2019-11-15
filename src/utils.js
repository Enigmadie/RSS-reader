import { isURL, isIn } from 'validator';

export const getSelectorContent = (el, selector, prop = 'textContent') => el.querySelector(selector)[prop];

export const parseRss = (data) => {
  const domparser = new DOMParser();
  const xmlContent = domparser.parseFromString(data, 'text/xml');
  const title = getSelectorContent(xmlContent, 'title');
  const description = getSelectorContent(xmlContent, 'description');
  const xmlItems = xmlContent.querySelectorAll('item');
  const posts = [];
  xmlItems.forEach((item) => {
    const itemTitle = getSelectorContent(item, 'title');
    const itemDescription = getSelectorContent(item, 'description');
    posts.push({
      title: itemTitle,
      description: itemDescription,
    });
  });
  return { title, description, posts };
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
