ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'petmatch';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
