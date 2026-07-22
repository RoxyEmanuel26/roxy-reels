# Search Videos — MISSAV-J

Search and browse JAV video posts from the MISSAV-J platform API.

## Endpoint
`GET https://www.missav-j.com/api/posts`

## Parameters
| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| lang      | string | Yes      | Language code (en, id, ja, ko, zh-cn, zh-tw, etc.) |
| page      | int    | Yes      | Page number (starts at 1) |
| site      | string | Yes      | Always use `missav-j.com` |
| q         | string | No       | Search keyword |
| actor     | string | No       | Filter by actor name |
| category  | string | No       | Filter by category |
| studio    | string | No       | Filter by studio name |

## Example Request
```
GET https://www.missav-j.com/api/posts?lang=en&page=1&site=missav-j.com
```

## Example Response
```json
{
  "data": [
    {
      "title": "Video Title",
      "url": "https://www.missav-j.com/en/watch/VIDEO-CODE",
      "thumbnail": "https://example.com/thumb.jpg",
      "actors": ["Actor Name"],
      "categories": ["Category"],
      "studio": "Studio Name"
    }
  ],
  "total": 117271,
  "page": 1
}
```
