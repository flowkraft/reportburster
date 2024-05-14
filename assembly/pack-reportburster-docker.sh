#rm -rf ../template-merged-directory/

#rsync -a ../backend/reporting/src/main/external-resources/template/ ../template-merged-directory/
#rsync -a ../assembly/src/main/external-resources/db-template/ ../template-merged-directory/
#rsync -a ../assembly/src/main/external-resources/db-server-template/ ../template-merged-directory/

docker build --no-cache --progress=plain -t reportburster_server:10.1.1 -f ../Dockerfile ..

#rm -rf ../template-merged-directory/