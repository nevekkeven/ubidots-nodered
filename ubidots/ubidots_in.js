module.exports = function (RED) {
  var mqtt = require('mqtt');

  const NODENAME = "ubidots_in";

  function getClient(node, endpoint_url, label_device, label_variable, token) {
    node.status({ fill: "green", shape: "ring", text: "ubidots.connecting" });

    const client = mqtt.connect('mqtt://' + endpoint_url, { username: token, password: "" });
    node.client = client;

    client.on('message', function (topic, message, packet) {
      node.emit("input", { payload: JSON.parse(message.toString()) });
    });

    client.on("error", function (error) {
      node.error(error);
      node.status({ fill: "red", shape: "ring", text: "ubidots.error_connecting" });
    });

    client.on('close', function () {
      node.status({ fill: "red", shape: "ring", text: "ubidots.offline" });
    });

    client.on("connect", function () {
      var topic = "/v1.6/devices/" + label_device + "/" + label_variable;
      var options = {};

      node.status({ fill: "green", shape: "dot", text: "ubidots.connected" });
      options[topic] = 1;

      client.subscribe(options, function (err, granted) {
        
      });
    });
  }

  function UbidotsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const endpoint_urls = {
      business: 'industrial.api.ubidots.com',
      educational: 'things.ubidots.com'
    };

    const label_device = config.device_label || config.label_device;
    const label_variable = config.label_variable;
    const endpoint_url = endpoint_urls[config.tier] || endpoint_urls['business'];
    const token = config.token;

    getClient(node, endpoint_url, label_device, label_variable, token);

    node.on("error", function () {
      node.status({ fill: "red", shape: "ring", text: "ubidots.error_connecting" });
    });

    node.on("close", function () {
      if (node.client !== null && node.client !== undefined) {
        node.client.end(true, function () { });
      }
    });

    node.on("input", function (msg) {
      try {
        node.send(msg);
      } catch (err) {
        node.error(err, msg);
      }
    });
  }

  RED.nodes.registerType(NODENAME, UbidotsNode);
};
