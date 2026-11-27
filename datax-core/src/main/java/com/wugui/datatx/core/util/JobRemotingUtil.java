package com.wugui.datatx.core.util;

import com.wugui.datatx.core.biz.model.ReturnT;
import com.wugui.datax.rpc.util.json.BasicJson;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;

/**
 * @author xuxueli 2018-11-25 00:55:31
 */
public class JobRemotingUtil {
    private static Logger logger = LoggerFactory.getLogger(JobRemotingUtil.class);
    public static String XXL_RPC_ACCESS_TOKEN = "XXL-RPC-ACCESS-TOKEN";

    /**
     * 发送 POST 请求
     *
     * @param url
     * @param accessToken
     * @param requestObj
     * @return
     */
    public static ReturnT<String> postBody(String url, String accessToken, Object requestObj, int timeout) {
        HttpURLConnection connection = null;
        BufferedReader bufferedReader = null;
        try {
            // 连接对象
            URL realUrl = new URL(url);
            connection = (HttpURLConnection) realUrl.openConnection();

            // 配置连接参数
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setDoInput(true);
            connection.setUseCaches(false);
            connection.setReadTimeout(timeout * 1000);
            connection.setConnectTimeout(3 * 1000);
            connection.setRequestProperty("connection", "Keep-Alive");
            connection.setRequestProperty("Content-Type", "application/json;charset=UTF-8");
            connection.setRequestProperty("Accept-Charset", "application/json;charset=UTF-8");

            if(accessToken!=null && accessToken.trim().length()>0){
                connection.setRequestProperty(XXL_RPC_ACCESS_TOKEN, accessToken);
            }

            // 建立连接
            connection.connect();

            // 写入请求体
            String requestBody = BasicJson.toJson(requestObj);

            DataOutputStream dataOutputStream = new DataOutputStream(connection.getOutputStream());
            dataOutputStream.writeBytes(requestBody);
            dataOutputStream.flush();
            dataOutputStream.close();

            /*byte[] requestBodyBytes = requestBody.getBytes("UTF-8");
            connection.setRequestProperty("Content-Length", String.valueOf(requestBodyBytes.length));
            OutputStream outwritestream = connection.getOutputStream();
            outwritestream.write(requestBodyBytes);
            outwritestream.flush();
            outwritestream.close();*/

            // 校验响应状态码
            int statusCode = connection.getResponseCode();
            if (statusCode != 200) {
                return new ReturnT<String>(ReturnT.FAIL_CODE, "xxl-rpc remoting fail, StatusCode("+ statusCode +") invalid. for url : " + url);
            }

            // 返回结果
            bufferedReader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            StringBuilder result = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                result.append(line);
            }
            String resultJson = result.toString();

            // 解析统一返回结果
            try {
                Map<String, Object> resultMap = BasicJson.parseMap(resultJson);

                ReturnT<String> returnT = new ReturnT<String>();
                if (resultMap==null) {
                    returnT.setCode(ReturnT.FAIL_CODE);
                    returnT.setMsg("AdminBizClient Remoting call fail.");
                } else {
                    returnT.setCode(Integer.valueOf(String.valueOf(resultMap.get("code"))));
                    returnT.setMsg(String.valueOf(resultMap.get("msg")));
                    returnT.setContent(String.valueOf(resultMap.get("content")));
                }
                return returnT;
            } catch (Exception e) {
                logger.error("xxl-rpc remoting (url="+url+") response content invalid("+ resultJson +").", e);
                return new ReturnT<String>(ReturnT.FAIL_CODE, "xxl-rpc remoting (url="+url+") response content invalid("+ resultJson +").");
            }

        } catch (Exception e) {
            logger.error(e.getMessage(), e);
            return new ReturnT<String>(ReturnT.FAIL_CODE, "xxl-rpc remoting error("+ e.getMessage() +"), for url : " + url);
        } finally {
            try {
                if (bufferedReader != null) {
                    bufferedReader.close();
                }
                if (connection != null) {
                    connection.disconnect();
                }
            } catch (Exception e2) {
                logger.error(e2.getMessage(), e2);
            }
        }
    }

}
