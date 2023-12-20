IF EXIST dist (
	del /S /Q dist\*
	RMDIR /S /Q dist
)

IF EXIST target (
	del /S /Q target\*
	RMDIR /S /Q target
)

IF EXIST pack-documentburster.log (del /f /q pack-documentburster.log)

mvn clean test -Dtest=AssemblerTest#assembleDocumentBursterAndDocumentBursterServer -X > pack-documentburster.log