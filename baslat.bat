@echo off
rem Uygulamayi yerel sunucuda acar. Cevrimdisi calisma, mikrofon ve "uygulamayi yukle"
rem ozellikleri dosyaya cift tiklayinca degil, ancak bu sekilde calisir.
cd /d "%~dp0"
start "" http://localhost:8770/
python -m http.server 8770
