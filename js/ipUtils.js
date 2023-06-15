const os = require('os');

function get_local_ip_address() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
      const interface = interfaces[interfaceName];
      for (const iface of interface) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return null;
  }

module.exports = get_local_ip_address;
