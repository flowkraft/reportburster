IF EXIST dist (
	del /S /Q dist\*
	RMDIR /S /Q dist
)

IF EXIST pack-prepare-for-e2e.log (del /f /q pack-prepare-for-e2e.log)

mvn clean test -Dtest=AssemblerTest#prepareForE2E -X > pack-prepare-for-e2e.log