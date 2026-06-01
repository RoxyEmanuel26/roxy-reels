async function fetchLatest() {
  const url = 'https://server.apijav.com/wp-json/myvideo/v1/posts?per_page=10';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Latest 10 posts:`);
    data.forEach(p => {
      console.log(`ID: ${p.id} | Code: ${p.code} | Views: ${p.views} | Title: "${p.title}"`);
    });
  } catch (err) {
    console.error(err);
  }
}
fetchLatest();
