import org.apache.log4j.LogManager;
import org.apache.log4j.Logger;
import org.apache.log4j.xml.DOMConfigurator;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.ParseException;

import java.io.DataOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class Client implements Runnable {

    private List<Message> history = new ArrayList<Message>();
    private MessageExchange messageExchange = new MessageExchange();
    private String host;
    private Integer port;

    private static Logger logger;

    static {
        new DOMConfigurator().doConfigure("logger/clientLogConfiguration.xml", LogManager.getLoggerRepository());
        logger = Logger.getLogger(Client.class);
    }

    public Client(String host, Integer port) {
        this.host = host;
        this.port = port;
    }


    public static void main(String[] args) {
        if (args.length != 2) {
            System.out.println("Usage: java ChatClient host port");
            logger.debug("Usage: java ChatClient host port");
        }
        else {
            System.out.println("Connection to server...");
            logger.debug("Connection to server...");
            String serverHost = args[0];
            Integer serverPort = Integer.parseInt(args[1]);
            Client client = new Client(serverHost, serverPort);
            new Thread(client).start();
            System.out.println("Connected to server: " + serverHost + ":" + serverPort);
            logger.debug("Connected to server: " + serverHost + ":" + serverPort);
            client.listen();
        }
    }

    private HttpURLConnection getHttpURLConnection() throws IOException {
        URL url = new URL("http://" + host + ":" + port + "/chat?token=" + messageExchange.getToken(history.size()));
        return (HttpURLConnection) url.openConnection();
    }

    public List<Message> getMessages() {
        List<Message> list = new ArrayList<Message>();
        HttpURLConnection connection = null;
        try {
            connection = getHttpURLConnection();
            connection.connect();
            String response = messageExchange.inputStreamToString(connection.getInputStream());
            JSONObject jsonObject = messageExchange.getJSONObject(response);
            JSONArray jsonArray = (JSONArray) jsonObject.get("message");
            for (Object o : jsonArray) {
                System.out.println(o);
                list.add(messageExchange.getMessageFromJSONObject((JSONObject) o));
            }
        } catch (IOException e) {
            System.err.println("ERROR: " + e.getMessage());
            logger.error(e);
        } catch (ParseException e) {
            System.err.println("ERROR: " + e.getMessage());
            logger.error(e);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
        return list;
    }

    public void sendMessage(Message message) {
        HttpURLConnection connection = null;
        try {
            logger.debug("request begin");
            connection = getHttpURLConnection();
            logger.debug("request parameters: token=" + messageExchange.getToken(history.size()));
            connection.setDoOutput(true);

            connection.setRequestMethod("POST");
            logger.debug("method POST");

            DataOutputStream wr = new DataOutputStream(connection.getOutputStream());

            byte[] bytes = messageExchange.getClientSendMessageRequest(message).getBytes();
            wr.write(bytes, 0, bytes.length);
            wr.flush();
            wr.close();

            connection.getInputStream();

        } catch (IOException e) {
            System.err.println("ERROR: " + e.getMessage());
            logger.error(e);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
            logger.debug("request end");
        }
    }

    public void listen() {
        while (true) {
            List<Message> list = getMessages();

            if (list.size() > 0) {
                logger.debug("response with some Messages sent");
                history.addAll(list);
                logger.debug("response: history size=" + history.size());
            }


            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                System.err.println("ERROR: " + e.getMessage());
                logger.error(e);
            }
        }
    }

    @Override
    public void run() {
        Scanner scanner = new Scanner(System.in);

        while (true) {
            Message message = new Message();
            message.setMessage(scanner.nextLine());
            /*this.id = id;
            this.author = author;
            this.message = message;
            */
            message.setDeleted(false);
            //this.date = date;
            message.setEditDelete(true);
            sendMessage(message);
        }
    }
}
