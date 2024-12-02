#include <WiFi.h>
#include <WebSocketsClient.h>
#include <Adafruit_SHT31.h>
#include <ArduinoJson.h>
#include <Wire.h>

const char* ssid = "Tbag";
const char* password = "Dbcooper";
const char* websocket_server = "16.171.32.237";
const uint16_t websocket_port = 8000;

WebSocketsClient webSocket;
Adafruit_SHT31 sht31 = Adafruit_SHT31();

void setup() {
  Serial.begin(115200);
  Wire.begin(41, 42);
  Serial.println("Starting setup...");
  
  // Initialize SHT31
  if (!sht31.begin(0x44)) {
    Serial.println("Couldn't find SHT31");
    while (1) delay(1);
  }
  Serial.println("SHT31 initialized");

  // Connect to WiFi
  Serial.printf("Connecting to WiFi %s\n", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.printf("IP address: %s\n", WiFi.localIP().toString().c_str());

  // WebSocket setup
  Serial.printf("Connecting to WebSocket server %s:%d\n", websocket_server, websocket_port);
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
      Serial.printf("Sending: %s\n", jsonString.c_str());
      webSocket.sendTXT(jsonString);
    } else {
      Serial.println("Failed to read sensor");
    }
    
    lastTime = millis();
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket Disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket Connected!");
      break;
    case WStype_TEXT:
      Serial.printf("Received: %s\n", payload);
      break;
    case WStype_ERROR:
      Serial.println("WebSocket Error!");
      break;
  }
} 