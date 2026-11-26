-- Current 2.1.2 schema for automatic startup initialization.

-- Existing tables and rows are preserved; this is not an upgrade migration.

SET NAMES utf8mb4;


-- ============================================================
-- 1. job_group: 执行器分组表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_group` (
    `id`            INT(11)       NOT NULL AUTO_INCREMENT,
    `app_name`      VARCHAR(64)   NOT NULL                 COMMENT '执行器AppName',
    `title`         VARCHAR(32)   NOT NULL                 COMMENT '执行器名称',
    `order`         INT(11)       NOT NULL DEFAULT 0       COMMENT '排序',
    `address_type`  TINYINT(4)    NOT NULL DEFAULT 0       COMMENT '执行器地址类型：0=自动注册、1=手动录入',
    `address_list`  VARCHAR(512)      NULL DEFAULT NULL    COMMENT '执行器地址列表，多地址逗号分隔',
    PRIMARY KEY (`id`)
) COMMENT='';

-- ============================================================
-- 2. job_info: 任务配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_info` (
    `id`                         INT(11)       NOT NULL AUTO_INCREMENT,
    `job_group`                  INT(11)       NOT NULL               COMMENT '执行器主键ID',
    `job_cron`                   VARCHAR(128)  NOT NULL               COMMENT '任务执行CRON',
    `job_desc`                   VARCHAR(255)  NOT NULL               COMMENT '',
    `add_time`                   DATETIME(0)       NULL DEFAULT NULL  COMMENT '',
    `update_time`                DATETIME(0)       NULL DEFAULT NULL  COMMENT '',
    `user_id`                    INT(11)       NOT NULL               COMMENT '修改用户',
    `alarm_email`                VARCHAR(255)      NULL DEFAULT NULL  COMMENT '报警邮件',
    `executor_route_strategy`    VARCHAR(50)       NULL DEFAULT NULL  COMMENT '执行器路由策略',
    `executor_handler`           VARCHAR(255)      NULL DEFAULT NULL  COMMENT '执行器任务handler',
    `executor_param`             VARCHAR(512)      NULL DEFAULT NULL  COMMENT '执行器任务参数',
    `executor_block_strategy`    VARCHAR(50)       NULL DEFAULT NULL  COMMENT '阻塞处理策略',
    `executor_timeout`           INT(11)       NOT NULL DEFAULT '0'   COMMENT '任务执行超时时间，单位分钟',
    `executor_fail_retry_count`  INT(11)       NOT NULL DEFAULT 0     COMMENT '失败重试次数',
    `glue_type`                  VARCHAR(50)   NOT NULL               COMMENT 'GLUE类型',
    `glue_source`                MEDIUMTEXT        NULL               COMMENT 'GLUE源代码',
    `glue_remark`                VARCHAR(128)      NULL DEFAULT NULL  COMMENT 'GLUE备注',
    `glue_updatetime`            DATETIME(0)       NULL DEFAULT NULL  COMMENT 'GLUE更新时间',
    `child_jobid`                VARCHAR(255)      NULL DEFAULT NULL  COMMENT '子任务ID，多个逗号分隔',
    `trigger_status`             TINYINT(4)    NOT NULL DEFAULT 0     COMMENT '调度状态：0-停止，1-运行',
    `trigger_last_time`          BIGINT(13)    NOT NULL DEFAULT 0     COMMENT '上次调度时间',
    `trigger_next_time`          BIGINT(13)    NOT NULL DEFAULT 0     COMMENT '下次调度时间',
    `job_json`                   TEXT              NULL               COMMENT 'datax运行脚本',
    `replace_param`              VARCHAR(100)      NULL DEFAULT NULL  COMMENT '动态参数',
    `jvm_param`                  VARCHAR(200)      NULL DEFAULT NULL  COMMENT 'jvm参数',
    `inc_start_time`             DATETIME          NULL DEFAULT NULL  COMMENT '增量初始时间',
    `partition_info`             VARCHAR(100)      NULL DEFAULT NULL  COMMENT '分区信息',
    `last_handle_code`           INT(11)           NULL DEFAULT '0'   COMMENT '最近一次执行状态',
    `replace_param_type`         VARCHAR(255)      NULL               COMMENT '增量时间格式',
    `project_id`                 INT(11)           NULL               COMMENT '所属项目id',
    `reader_table`               VARCHAR(255)      NULL               COMMENT 'reader表名称',
    `primary_key`                VARCHAR(50)       NULL               COMMENT '增量表主键',
    `inc_start_id`               VARCHAR(20)       NULL               COMMENT '增量初始id',
    `increment_type`             TINYINT(4)        NULL DEFAULT 0     COMMENT '增量类型',
    `datasource_id`              BIGINT(11)        NULL               COMMENT '数据源id',
    PRIMARY KEY (`id`)
) COMMENT='';

-- ============================================================
-- 3. job_jdbc_datasource: JDBC数据源配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_jdbc_datasource` (
    `id`                 BIGINT(20)     NOT NULL AUTO_INCREMENT    COMMENT '自增主键',
    `datasource_name`    VARCHAR(200)   NOT NULL                   COMMENT '数据源名称',
    `datasource_group`   VARCHAR(200)       NULL DEFAULT 'Default' COMMENT '数据源分组',
    `jdbc_username`      VARCHAR(100)       NULL DEFAULT NULL      COMMENT '用户名',
    `jdbc_password`      VARCHAR(200)       NULL DEFAULT NULL      COMMENT '密码',
    `jdbc_url`           VARCHAR(500)   NOT NULL                   COMMENT 'jdbc url',
    `jdbc_driver_class`  VARCHAR(200)       NULL DEFAULT NULL      COMMENT 'jdbc驱动类',
    `datasource`         VARCHAR(45)    NOT NULL                   COMMENT '数据源',
    `zk_adress`          VARCHAR(200)       NULL DEFAULT NULL,
    `database_name`      VARCHAR(45)        NULL DEFAULT NULL      COMMENT '数据库名',
    `status`             TINYINT(1)     NOT NULL DEFAULT 1         COMMENT '状态：0删除 1启用 2禁用',
    `create_by`          VARCHAR(20)        NULL DEFAULT NULL      COMMENT '创建人',
    `create_date`        DATETIME(0)        NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
    `update_by`          VARCHAR(20)        NULL DEFAULT NULL      COMMENT '更新人',
    `update_date`        DATETIME(0)        NULL DEFAULT NULL      COMMENT '更新时间',
    `comments`           VARCHAR(1000)      NULL DEFAULT NULL      COMMENT '备注',
    PRIMARY KEY (`id`)
) COMMENT='jdbc数据源配置';

-- ============================================================
-- 4. job_lock: 调度锁表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_lock` (
    `lock_name`  VARCHAR(50)  NOT NULL  COMMENT '锁名称',
    PRIMARY KEY (`lock_name`)
) COMMENT='';

-- ============================================================
-- 5. job_log: 任务执行日志表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_log` (
    `id`                         BIGINT(20)    NOT NULL AUTO_INCREMENT,
    `job_group`                  INT(11)       NOT NULL               COMMENT '执行器主键ID',
    `job_id`                     INT(11)       NOT NULL               COMMENT '任务，主键ID',
    `job_desc`                   VARCHAR(255)      NULL DEFAULT NULL, 
    `executor_address`           VARCHAR(255)      NULL DEFAULT NULL  COMMENT '执行器地址，本次执行的地址',
    `executor_handler`           VARCHAR(255)      NULL DEFAULT NULL  COMMENT '执行器任务handler',
    `executor_param`             VARCHAR(512)      NULL DEFAULT NULL  COMMENT '执行器任务参数',
    `executor_sharding_param`    VARCHAR(20)       NULL DEFAULT NULL  COMMENT '执行器任务分片参数，格式如 1/2',
    `executor_fail_retry_count`  INT(11)           NULL DEFAULT 0     COMMENT '失败重试次数',
    `trigger_time`               DATETIME(0)       NULL DEFAULT NULL  COMMENT '调度-时间',
    `trigger_code`               INT(11)       NOT NULL               COMMENT '调度-结果',
    `trigger_msg`                TEXT              NULL               COMMENT '调度-日志',
    `handle_time`                DATETIME(0)       NULL DEFAULT NULL  COMMENT '执行-时间',
    `handle_code`                INT(11)       NOT NULL               COMMENT '执行-状态',
    `handle_msg`                 TEXT              NULL               COMMENT '执行-日志',
    `alarm_status`               TINYINT(4)    NOT NULL DEFAULT 0     COMMENT '告警状态：0-默认、1-无需告警、2-告警成功、3-告警失败',
    `process_id`                 VARCHAR(20)       NULL DEFAULT NULL  COMMENT 'datax进程Id',
    `max_id`                     BIGINT(20)        NULL DEFAULT NULL  COMMENT '增量表max id',
    PRIMARY KEY (`id`),
    KEY `I_trigger_time` (`trigger_time`),
    KEY `I_handle_code` (`handle_code`)
) COMMENT='';

-- ============================================================
-- 6. job_log_report: 任务日志统计表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_log_report` (
    `id`             INT(11)      NOT NULL AUTO_INCREMENT,
    `trigger_day`    DATETIME(0)      NULL DEFAULT NULL    COMMENT '调度-时间',
    `running_count`  INT(11)      NOT NULL DEFAULT 0       COMMENT '运行中-日志数量',
    `suc_count`      INT(11)      NOT NULL DEFAULT 0       COMMENT '执行成功-日志数量',
    `fail_count`     INT(11)      NOT NULL DEFAULT 0       COMMENT '执行失败-日志数量',
    PRIMARY KEY (`id`),
    UNIQUE KEY `i_trigger_day` (`trigger_day`)
) COMMENT='';

-- ============================================================
-- 7. job_logglue: GLUE代码历史表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_logglue` (
    `id`           INT(11)       NOT NULL AUTO_INCREMENT,
    `job_id`       INT(11)       NOT NULL                 COMMENT '任务，主键ID',
    `glue_type`    VARCHAR(50)       NULL DEFAULT NULL    COMMENT 'GLUE类型',
    `glue_source`  MEDIUMTEXT        NULL                 COMMENT 'GLUE源代码',
    `glue_remark`  VARCHAR(128)  NOT NULL                 COMMENT 'GLUE备注',
    `add_time`     DATETIME(0)       NULL DEFAULT NULL,
    `update_time`  DATETIME(0)       NULL DEFAULT NULL,
    PRIMARY KEY (`id`)
) COMMENT='';

-- ============================================================
-- 8. job_registry: 执行器注册表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_registry` (
    `id`              INT(11)       NOT NULL AUTO_INCREMENT,
    `registry_group`  VARCHAR(50)   NOT NULL              COMMENT '注册组',
    `registry_key`    VARCHAR(191)  NOT NULL              COMMENT '注册键',
    `registry_value`  VARCHAR(191)  NOT NULL              COMMENT '注册值',
    `cpu_usage`       DOUBLE            NULL              COMMENT 'CPU使用率',
    `memory_usage`    DOUBLE            NULL              COMMENT '内存使用率',
    `load_average`    DOUBLE            NULL              COMMENT '负载平均值',
    `update_time`     DATETIME(0)       NULL DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `i_g_k_v` (`registry_group`, `registry_key`, `registry_value`)
) COMMENT='';

-- ============================================================
-- 9. job_user: 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_user` (
    `id`          INT(11)       NOT NULL AUTO_INCREMENT,
    `username`    VARCHAR(50)   NOT NULL              COMMENT '账号',
    `password`    VARCHAR(100)  NOT NULL              COMMENT '密码',
    `role`        VARCHAR(50)       NULL DEFAULT NULL COMMENT '角色：0-普通用户、1-管理员',
    `permission`  VARCHAR(255)      NULL DEFAULT NULL COMMENT '权限：执行器ID列表，多个逗号分割',
    PRIMARY KEY (`id`),
    UNIQUE KEY `i_username` (`username`)
) COMMENT='';

-- ============================================================
-- 10. job_template: 任务模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_template` (
    `id`                        INT(11)       NOT NULL AUTO_INCREMENT,
    `job_group`                 INT(11)       NOT NULL               COMMENT '执行器主键ID',
    `project_id`                INT(11)           NULL DEFAULT NULL  COMMENT '所属项目Id',
    `job_cron`                  VARCHAR(128)  NOT NULL               COMMENT '任务执行CRON',
    `job_desc`                  VARCHAR(255)  NOT NULL               COMMENT '任务描述',
    `alarm_email`               VARCHAR(255)      NULL DEFAULT NULL  COMMENT '报警邮件',
    `executor_route_strategy`   VARCHAR(50)       NULL DEFAULT NULL  COMMENT '执行器路由策略',
    `executor_handler`          VARCHAR(255)      NULL DEFAULT NULL  COMMENT '执行器任务handler',
    `executor_param`            VARCHAR(512)      NULL DEFAULT NULL  COMMENT '执行器参数',
    `executor_block_strategy`   VARCHAR(50)       NULL DEFAULT NULL  COMMENT '阻塞处理策略',
    `executor_timeout`          INT(11)       NOT NULL DEFAULT 0     COMMENT '任务执行超时时间，单位秒',
    `executor_fail_retry_count` INT(11)       NOT NULL DEFAULT 0     COMMENT '失败重试次数',
    `glue_type`                 VARCHAR(50)   NOT NULL               COMMENT 'GLUE类型',
    `glue_source`               MEDIUMTEXT        NULL               COMMENT 'GLUE源代码',
    `glue_remark`               VARCHAR(128)      NULL DEFAULT NULL  COMMENT 'GLUE备注',
    `glue_updatetime`           DATETIME(0)       NULL DEFAULT NULL  COMMENT 'GLUE更新时间',
    `child_jobid`               VARCHAR(255)      NULL DEFAULT NULL  COMMENT '子任务ID，多个逗号分隔',
    `trigger_last_time`         BIGINT(13)    NOT NULL DEFAULT 0     COMMENT '上次调度时间',
    `trigger_next_time`         BIGINT(13)    NOT NULL DEFAULT 0     COMMENT '下次调度时间',
    `job_json`                  TEXT              NULL               COMMENT 'datax运行脚本',
    `jvm_param`                 VARCHAR(200)      NULL DEFAULT NULL  COMMENT 'jvm参数',
    `add_time`                  DATETIME(0)       NULL DEFAULT NULL  COMMENT '添加时间',
    `update_time`               DATETIME(0)       NULL DEFAULT NULL  COMMENT '更新时间',
    `user_id`                   INT(11)       NOT NULL               COMMENT '修改用户',
    PRIMARY KEY (`id`)
) COMMENT='';

-- ============================================================
-- 11. job_permission: 权限表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_permission` (
    `id`           INT(11)       NOT NULL AUTO_INCREMENT  COMMENT '主键',
    `name`         VARCHAR(50)   NOT NULL                 COMMENT '权限名',
    `description`  VARCHAR(11)       NULL DEFAULT NULL    COMMENT '权限描述',
    `url`          VARCHAR(255)      NULL DEFAULT NULL    COMMENT '权限URL',
    `pid`          INT(11)           NULL DEFAULT NULL    COMMENT '父权限ID',
    PRIMARY KEY (`id`)
) COMMENT='';

-- ============================================================
-- 12. job_project: 项目表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_project_datasource` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `datasource_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_datasource` (`project_id`, `datasource_id`),
  KEY `idx_project_datasource_source` (`datasource_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `job_project` (
    `id`           INT(11)       NOT NULL AUTO_INCREMENT               COMMENT 'key',
    `name`         VARCHAR(100)      NULL DEFAULT NULL                 COMMENT 'project name',
    `description`  VARCHAR(200)      NULL DEFAULT NULL,
    `user_id`      INT(11)           NULL DEFAULT NULL                 COMMENT 'creator id',
    `flag`         TINYINT(4)        NULL DEFAULT 1                    COMMENT '0 not available, 1 available',
    `create_time`  DATETIME(0)       NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT 'create time',
    `update_time`  DATETIME(0)       NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT 'update time',
    PRIMARY KEY (`id`)
) COMMENT='';

-- ============================================================
-- 13. job_json_template: JSON任务模板表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_template` (
    `id`                    BIGINT         NOT NULL AUTO_INCREMENT,
    `name`                  VARCHAR(100)   NOT NULL              COMMENT '',
    `description`           VARCHAR(1000)           DEFAULT NULL COMMENT '',
    `owner_id`              INT            NOT NULL              COMMENT '',
    `reader_datasource_id`  BIGINT         NOT NULL              COMMENT '',
    `writer_datasource_id`  BIGINT         NOT NULL              COMMENT '',
    `build_config`          LONGTEXT       NOT NULL              COMMENT '',
    `job_json`              LONGTEXT       NOT NULL              COMMENT 'Encrypted JSON configuration',
    `version`               INT            NOT NULL DEFAULT 1    COMMENT '',
    `create_time`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_json_template_owner` (`owner_id`, `update_time`)
) COMMENT='';

-- ============================================================
-- 14. job_json_batch_sequence: JSON批次流水号表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_batch_sequence` (
    `issue_day`      DATE    NOT NULL           COMMENT '',
    `current_value`  BIGINT  NOT NULL           COMMENT '',
    PRIMARY KEY (`issue_day`)
) COMMENT='';

-- ============================================================
-- 15. job_json_batch: JSON批次表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_batch` (
    `id`           VARCHAR(64)   NOT NULL            COMMENT '',
    `batch_code`   VARCHAR(32)   NOT NULL            COMMENT '',
    `owner_id`     INT           NOT NULL            COMMENT '',
    `name`         VARCHAR(100)  NOT NULL DEFAULT '' COMMENT '',
    `create_time`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_json_batch_code` (`batch_code`),
    KEY `idx_json_batch_owner` (`owner_id`, `create_time`)
) COMMENT='';

-- ============================================================
-- 16. job_json_batch_item: JSON批次明细表
-- ============================================================
CREATE TABLE IF NOT EXISTS `job_json_batch_item` (
    `template_id`  BIGINT       NOT NULL,
    `batch_id`     VARCHAR(64)  NOT NULL,
    PRIMARY KEY (`template_id`),
    KEY `idx_json_batch_item` (`batch_id`, `template_id`)
) COMMENT='';


INSERT INTO job_group (app_name, title, `order`, address_type) SELECT 'datax-executor', 'datax执行器', 1, 0 WHERE NOT EXISTS (SELECT 1 FROM job_group WHERE app_name = 'datax-executor');
INSERT INTO job_lock (lock_name) SELECT 'schedule_lock' WHERE NOT EXISTS (SELECT 1 FROM job_lock WHERE lock_name = 'schedule_lock');
INSERT INTO job_user (username, password, role) SELECT 'admin', '$2a$10$2KCqRbra0Yn2TwvkZxtfLuWuUP5KyCWsljO/ci5pLD27pqR3TV1vy', 'ROLE_ADMIN' WHERE NOT EXISTS (SELECT 1 FROM job_user WHERE username = 'admin');
