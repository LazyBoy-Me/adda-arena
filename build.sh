#!/bin/sh
# Adda Arena — APK build without Gradle/Android Studio.
# Needs: aapt2, d8, apksigner, javac, keytool, zip
set -eu
cd "$(dirname "$0")"

SDK="${SDK:-sdk/android.jar}"
OUT=out
NAME=adda-arena

if [ ! -f "$SDK" ]; then
  echo "missing $SDK (android.jar)"; exit 1
fi

echo "[1/6] staging web assets"
rm -rf android/assets/web
mkdir -p android/assets web/../android/assets
cp -r web/. android/assets/web/
rm -rf android/assets/web/sw.js

rm -rf "$OUT"
mkdir -p "$OUT/compiled" "$OUT/classes" "$OUT/dex" "$OUT/gen"

echo "[2/6] compiling resources"
aapt2 compile --dir android/res -o "$OUT/compiled/res.zip"

echo "[3/6] linking"
aapt2 link -o "$OUT/base.apk" \
  -I "$SDK" \
  --manifest android/AndroidManifest.xml \
  -R "$OUT/compiled/res.zip" --auto-add-overlay \
  --java "$OUT/gen" \
  -A android/assets \
  --min-sdk-version 24 \
  --target-sdk-version 35 \
  --version-code 1 \
  --version-name 1.0

echo "[4/6] compiling java"
find android/src "$OUT/gen" -name '*.java' > "$OUT/sources.txt"
javac -source 8 -target 8 -Xlint:-options \
  -bootclasspath "$SDK" -classpath "$SDK" \
  -d "$OUT/classes" @"$OUT/sources.txt"

echo "[5/6] dexing"
find "$OUT/classes" -name '*.class' > "$OUT/classes.txt"
d8 --release --min-api 24 --lib "$SDK" --output "$OUT/dex" @"$OUT/classes.txt"

(cd "$OUT/dex" && zip -q -j ../base.apk classes.dex)

echo "[6/6] signing"
if [ ! -f android/debug.keystore ]; then
  keytool -genkeypair -v -keystore android/debug.keystore -storepass android -keypass android \
    -alias addaarena -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Adda Arena, O=Dotbhai, C=BD" >/dev/null 2>&1
fi

apksigner sign --ks android/debug.keystore --ks-pass pass:android --key-pass pass:android \
  --ks-key-alias addaarena --min-sdk-version 24 --out "$NAME.apk" "$OUT/base.apk"
apksigner verify --min-sdk-version 24 "$NAME.apk"

echo "built: $(pwd)/$NAME.apk ($(du -h "$NAME.apk" | cut -f1))"
