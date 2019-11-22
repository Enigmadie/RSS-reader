export const getSelectorContent = (el, selector, prop = 'textContent') => el.querySelector(selector)[prop];

export const parseRss = (data, id) => {
  const domparser = new DOMParser();
  const xmlContent = domparser.parseFromString(data, 'text/xml');
  const title = getSelectorContent(xmlContent, 'title');
  const description = getSelectorContent(xmlContent, 'description');
  const xmlItems = xmlContent.querySelectorAll('item');
  const posts = [];
  xmlItems.forEach((item, postId) => {
    const itemTitle = getSelectorContent(item, 'title');
    const itemDescription = getSelectorContent(item, 'description');
    posts.push({
      id: postId,
      feedId: id,
      title: itemTitle,
      description: itemDescription,
    });
  });
  return { title, description, posts };
};

export const buildPath = (path) => `https://cors-anywhere.herokuapp.com/${path}`;
