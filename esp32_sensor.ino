#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Adafruit_SHT31.h>
#include <ArduinoJson.h>

const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* websocket_server = "your-aws-ip";
const uint16_t websocket_port = 8000;

WebSocketsClient webSocket;
Adafruit_SHT31 sht31 = Adafruit_SHT31();

void setup() {
  Serial.begin(115200);
  
  // Initialize SHT31
  if (!sht31.begin(0x44)) {
    Serial.println("Couldn't find SHT31");
    while (1) delay(1);
  }

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");

  // WebSocket setup
  webSocket.begin(websocket_server, websocket_port, "/ws");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();

  static unsigned long lastTime = 0;
  if (millis() - lastTime > 5000) {
    float temp = sht31.readTemperature();
    float hum = sht31.readHumidity();

    if (!isnan(temp) && !isnan(hum)) {
      StaticJsonDocument<200> doc;
      doc["temperature"] = temp;
      doc["humidity"] = hum;

      String jsonString;
      serializeJson(doc, jsonString);
      webSocket.sendTXT(jsonString);
    }
    
    lastTime = millis();
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("Disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("Connected!");
      break;
    case WStype_TEXT:
      Serial.printf("Received: %s\n", payload);
      break;
  }
} 