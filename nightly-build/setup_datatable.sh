#!/bin/bash


midFile=1blA_H3Hv5S9Ii_vyudgDk-j6SfJQil9S
midFile=https://www.google.com/maps/d/u/0/kml?mid=1blA_H3Hv5S9Ii_vyudgDk-j6SfJQil9S&forcekml=1
outDir=`pwd`

fetchUrl="https://www.google.com/maps/d/u/0/kml?mid=${midFile}&forcekml=1"
dt=`date +%Y%m%d`

# 
dirName="export-${dt}"
mkdir -p $dirName
cd $dirName

dummy="kml?mid=${midFile}&forcekml=1"
curl -O ${fetchUrl} 
echo $fetchUrl
#mv $dummy export-${dt}.zip
#unzip export-${dt}

