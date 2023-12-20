package com.sourcekraft.batch.domain.filestore.internal;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.jdbc.core.support.JdbcDaoSupport;
import org.springframework.jdbc.support.lob.LobHandler;

import com.sourcekraft.batch.domain.filestore.FileStoreDao;

public class JdbcFileStoreDao extends JdbcDaoSupport implements FileStoreDao {

    private static Logger log = LoggerFactory.getLogger(JdbcFileStoreDao.class);

    private LobHandler lobHandler;

    public void setLobHandler(LobHandler lobHandler) {
        this.lobHandler = lobHandler;
    }

    public Number storeFileAndReturnId(File file) throws Exception {

        SimpleJdbcInsert insertFile =
                new SimpleJdbcInsert(getDataSource()).withTableName("BATCH_FILE_STORE").usingGeneratedKeyColumns("id");

        SqlParameterSource parameters =
                new MapSqlParameterSource().addValue("data", Files.readAllBytes(file.toPath()));

        Number id = insertFile.executeAndReturnKey(parameters);

        log.debug("storeFileAndReturnId(File file) : return id = " + id);

        return id;

    }

    public InputStream getStoredFile(Number id) {

        List<InputStream> result =
                getJdbcTemplate().query("SELECT DATA FROM BATCH_FILE_STORE WHERE ID=?", new Object[]{id},
                        new RowMapper<InputStream>() {
                            public InputStream mapRow(ResultSet rs, int rowNum) throws SQLException {
                                return lobHandler.getBlobAsBinaryStream(rs, 1);
                            }
                        });

        if ((result != null) && (result.size() == 1)) {
            return (InputStream) (result.get(0));
        }

        return null;

    }

    public int removeStoredFile(Number id) {

        log.debug("removeStoredFile(Number id) : id = " + id);

        int numberOfRowsDeleted = getJdbcTemplate().update("DELETE FROM BATCH_FILE_STORE WHERE ID=?", id);

        log.debug("removeStoredFile(Number id) : numberOfRowsDeleted = " + numberOfRowsDeleted);

        return numberOfRowsDeleted;
    }

}
