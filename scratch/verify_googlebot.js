async function testAsGooglebot(url) {
  console.log(`Fetching ${url} as Googlebot...`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html'
      }
    });

    if (!res.ok) {
      console.error(`HTTP Error: ${res.status}`);
      return;
    }

    const html = await res.text();

    // 1. Check for iframe
    const hasIframe = html.includes('<iframe') || html.includes('&lt;iframe');
    console.log(`\n1. Contains <iframe> markup? ${hasIframe}`);
    if (hasIframe) {
      const match = html.match(/<iframe[^>]*src="([^"]+)"[^>]*>/i);
      if (match) {
        console.log(`   Found iframe src: ${match[1]}`);
      }
    }

    // 2. Check JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json" id="json-ld-data">([\s\S]*?)<\/script>/i);
    console.log(`\n2. Contains JSON-LD schema? ${!!jsonLdMatch}`);
    if (jsonLdMatch) {
      console.log('   JSON-LD Content:');
      console.log(jsonLdMatch[1].trim());
      
      const containsEntities = jsonLdMatch[1].includes('&#038;') || jsonLdMatch[1].includes('&amp;');
      console.log(`\n   Contains unescaped HTML entities in JSON-LD? ${containsEntities}`);
    }

    // Print app-content section
    const appContentMatch = html.match(/<div id="app-content">([\s\S]*?)<\/main>/i);
    if (appContentMatch) {
      console.log('\nApp Content Block:');
      console.log(appContentMatch[1].trim());
    } else {
      console.log('\nCould not find app-content block');
    }

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// Test with one of the failed URLs
testAsGooglebot('https://www.missav-j.com/en/watch/gajk-029-gajk-029-a-schoolgirl-is-tied-up-and-trained-in-the-storehouse-her-stepfather-disciplines-her-96475');
