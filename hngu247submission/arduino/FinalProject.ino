#include <Arduino_JSON.h>

//https://youtu.be/DeljoWl1Knw
int trigPin = 7;
int echoPin = 8;
const int buzzPin = 9; 
long duration, cm, inches;
bool active = false;

JSONVar serialOutput;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzPin ,INPUT);
}

void loop() {

  if (Serial.available() > 0) {
    String jsonString = Serial.readStringUntil("\n");
    if (jsonString != '\n') {
      JSONVar serialInput = JSON.parse(jsonString);

      if (JSON.typeof(serialInput) == "undefined") {
        Serial.println("JSON parsing failed!");
      } else {
        active = (bool) serialInput["active"];
      }
    }
  }
    // put your main code here, to run repeatedly:
    if(active) {
      tone(buzzPin,600,200);
      active = !active;
    }
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    duration = pulseIn(echoPin, HIGH);

    cm = (duration/2) / 29.1;
    inches = (duration/2) / 74;

    serialOutput["cm"] = cm;
    serialOutput["inches"] = inches;

    Serial.println(serialOutput);
}