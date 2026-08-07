# Vestaboard Networking Notes

## mDNS Names
- Vestaboard 1 (first connected): `http://vestaboard` (or `vestaboard.local`)
- Vestaboard 2: `http://vestaboard-2.local`
- Vestaboard 3: `http://vestaboard-3.local`

## Network Scenarios
| Scenario | IP | Internet | Platform Access |
|----------|----|----------|-----------------|
| No DHCP, no global IPv6 | Link-local IPv6 (fe80::) | No | No (can't reach platform.vestaboard.com) |
| IPv6 only internet | IPv6 | Yes | No (platform needs IPv4) |
| Static IPv4, no internet | Static IPv4 | No | No |
| Static IPv4, with internet | Static IPv4 | Yes | Yes |
| DHCP, no internet | DHCP IPv4 | No | No |
| DHCP, with internet | DHCP IPv4 | Yes | Yes |

## Finding the Device
- Ping mDNS: `ping vestaboard` (or `vestaboard.local`)
- Check MAC in mobile app → Advanced Settings

## Local API
All local API endpoints work with both mDNS names and IP addresses.
Port: 7000
