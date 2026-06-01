async function fetchPostDetails(id) {
  const url = `https://server.apijav.com/wp-json/myvideo/v1/posts/${id}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function run() {
  const ids = [118120, 118121, 118122];
  for (const id of ids) {
    const data = await fetchPostDetails(id);
    console.log(`\n=== Post ID ${id} ===`);
    console.log(`Title: ${data.title}`);
    console.log(`Code: ${data.code}`);
    console.log(`Embed URL: ${data.embed_url}`);
    console.log(`Thumbnail: ${data.thumbnail}`);
    console.log(`Duration: ${data.duration}`);
    console.log(`Views: ${data.views}`);
    console.log(`Categories:`, data.categories);
    console.log(`Tags:`, data.tags);
    console.log(`Actors:`, data.actors);
  }
}
run();
