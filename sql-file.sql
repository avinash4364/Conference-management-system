CREATE DATABASE IF NOT EXISTS CMS;

USE CMS;


-- total 9 tables and 5 procedures

create table user(
    user_id int(11) not null auto_increment,
    password varchar(32) not null,
    user_name varchar(255) not null unique, 
    user_fname varchar(255) not null,
    email_id varchar(255) not null, 
    phone_no bigint, 
    country varchar(255),   
    primary key(user_id)
);


create table pc_chair(
    user_id int(11) not null,
    chair_id int(11) not null auto_increment,
    primary key(chair_id,user_id),
    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE
);


create table conference( 
    conf_id int(11) not null,
    conf_name varchar(255) not null unique, 
    start_date date default (CURRENT_DATE), 
    end_date date default (CURRENT_DATE+INTERVAL 1 DAY), 
    venue varchar(255) not null, 
    organiser varchar(255) not null,
    topic varchar(255), 
    primary key(conf_id),
    FOREIGN KEY(conf_id) REFERENCES pc_chair(chair_id) ON DELETE CASCADE
);


create table paper(
    paper_id int(11) not null auto_increment,
    title varchar(255) not null,
    topic varchar(255) not null,
    author_id int(11) not null,
    abstract blob,
    status enum('pending','reviewed','rejected') default 'pending',
    document_name varchar(255) not null,
    conf_id int(11) not null,
    primary key(paper_id),
    FOREIGN KEY(author_id) REFERENCES user(user_id) ON   DELETE CASCADE,
    FOREIGN KEY(conf_id) REFERENCES conference(conf_id) ON DELETE CASCADE   
);


create table request(
    user_id int(11) not null,
    conf_id int(11) not null,
    role enum('author','reviewer') default 'author',
    request enum('pending','accepted','rejected') default 'pending',
    FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY(conf_id) REFERENCES conference(conf_id) ON DELETE CASCADE,
    PRIMARY KEY(user_id,conf_id)
);

-- author and reviewer id is same as user_id

create table author(
    author_id int(11),
    conf_id int(11), 
    primary key(author_id,conf_id),
    FOREIGN KEY(author_id) REFERENCES user(user_id) ON DELETE CASCADE
);


create table authors(
    paper_id int(11),
    author_id int(11),
    authors_data JSON,
    primary key(paper_id,author_id),
    FOREIGN KEY (paper_id) REFERENCES paper(paper_id)
);


create table reviewer(
    r_id int(11),
	conf_id int(11), 
    primary key(r_id,conf_id),
    FOREIGN KEY(r_id) REFERENCES user(user_id) ON DELETE CASCADE
);


create table reviews(
    reviewer_id int(11) not null,
    paper_id int(11) not null,
    plagirism boolean,
    relevancy enum('1','2','3'),
    presentation enum('1','2','3','4','5'),
    originality enum('1','2','3','4','5'),
    status enum('accepted','rejected'),
    nominate boolean,
    FOREIGN KEY (reviewer_id) REFERENCES reviewer(r_id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES paper(paper_id),
    PRIMARY KEY(reviewer_id,paper_id)
);


delimiter //
create procedure insert_into_conference(conf_name varchar(255), start_date date, end_date date, venue varchar(255), organiser varchar(255), topic varchar(255),user_id int) 
BEGIN 
    insert into pc_chair(user_id) values(user_id); 
    insert into conference values (LAST_INSERT_ID(),conf_name,start_date,end_date,venue,organiser,topic); 
END //
delimiter ;


delimiter //
create procedure submit_paper(title varchar(255),topic varchar(255),userid int,abstract blob,document_name varchar(255), confid int,authors_data JSON ) 
BEGIN 
    insert into paper(title,topic,author_id,abstract,status,document_name,conf_id) values (title,topic,userid,abstract,"pending",document_name,confid); 
    insert into authors values(LAST_INSERT_ID(),userid,authors_data);
    insert into author(author_id,conf_id) 
    select * from (select userid as author_id ,confid as conf_id) as temp where NOT EXISTS(
        select * from author where author_id=userid and conf_id=confid
    );
END //
delimiter ;


delimiter //
create procedure submit_review(userid int, paperid int, confid int, pg boolean, rv char(1), pp char(1), og char(1), stat varchar(50), nominate boolean) 
BEGIN 
	set @p_id=(SELECT EXISTS(select * from author where author_id=userid and conf_id=confid));
	set @r_id=(SELECT EXISTS(select * from reviewer where r_id=userid and conf_id=confid));
	IF @p_id=0 AND @r_id=1
	THEN
		insert into reviews values(userid,paperid,pg,rv,pp,og ,stat,nominate);
        IF stat="accepted"
        THEN 
            update paper set status='reviewed' where paper_id=paperid;
        ELSE
            update paper set status='rejected' where paper_id=paperid;
        END IF;    
	END IF;
END //
delimiter ;


delimiter //
create procedure send_request(userid int,confname varchar(255),role varchar(255)) 
BEGIN 
    SET @valid=(
        SELECT EXISTS (
        SELECT conf_name from conference where conf_id NOT IN(SELECT chair_id from pc_chair as p ,user as u where u.user_id=p.user_id and u.user_id=userid UNION SELECT conf_id from request where user_id=userid) and conf_name=confname
        )
    );
    SET @id=(SELECT conf_id from conference where conf_name=confname);
    IF @valid=1
    THEN
        insert into request values(userid,@id,role,'pending');
    END IF;
END //
delimiter ;



delimiter //	
create procedure update_request(request varchar(255),userid int,confid int) 
BEGIN 
    update request set request=request where conf_id=confid and user_id=userid;
    SET @role = (select role from request where conf_id=confid and user_id=userid);
    IF @role="author"
    THEN 
        insert into author(author_id,conf_id) 
        select * from (select userid as author_id,confid as conf_id) as temp where NOT EXISTS(
        select * from author where author_id=userid and conf_id=confid);
    ELSE
        insert into reviewer(r_id,conf_id) 
        select * from (select userid as r_id,confid as conf_id) as temp where NOT EXISTS(
        select r_id from reviewer where r_id=userid and conf_id=confid);
    END IF;
END //
delimiter ;


-- check no. of tables(9)
show tables;

-- check no. of procedures(5)
SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_TYPE = 'PROCEDURE'     
AND 
    ROUTINE_SCHEMA='CMS';

-- dont remove it anyone
-- npm -g install npm
