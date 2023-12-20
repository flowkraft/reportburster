package com.sourcekraft.documentburster.engine;

import java.util.List;

public interface Burstable {

    void burst(String filePath, boolean testAll, String listOfTestTokens, int numberOfRandomTestTokens)
            throws Exception;
    
    List<String> parseBurstingMetaData() throws Exception;


}