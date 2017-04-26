# Details

A quick and dirty CDN warmer/courier; responds to cdn pull requests by fetching and serving the desired video segment, keeping it in Amazon EFS for other edge servers, and pre-fetching subsequent segments.

