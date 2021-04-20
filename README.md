# Usage

node transfer-defs.js config.yml

# Configuration

```yaml
# the server to copy from
source:
  host: ..
  username: ..
  password: ..
# the server to write to
destination:
  host: ..
  username: ..
  password: ..
# changes to make to the data
transform:
  # vhosts to include (all others ignored)
  vhosts: [user1, user1, ..]
```
