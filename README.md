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
  vhosts: [vhost1, vhost2, ..]
# configuration for consuming messages
listen:
  host: ..
  username: ..
  password: ..
  vhost: ..
  queues:
  - name: ..
    bindings:
    - exchange: ..
      routingKeyPattern: ..
```
