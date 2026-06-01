async function fetchSbp() {
  const url = 'https://server.apijav.com/wp-json/myvideo/v1/posts?search=SBP';
  console.log('Fetching:', url);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(`Found ${data.length} posts:`);
    data.forEach(p => {
      console.log(`ID: ${p.id} | Code: ${p.code} | Duration: ${p.duration} | Views: ${p.views} | Title: "${p.title}"`);
    });
  } catch (err) {
    console.error(err);
  }
}
fetchSbp();
