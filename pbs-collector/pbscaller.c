#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <pbs_error.h>
#include <pbs_ifl.h>
#include <unistd.h>
#include <signal.h>

extern char *pbs_server;

int process_data(struct batch_status *bs,char* type);

int process_data_json(struct batch_status *bs,char* type, const char* output_dir);

int main(int argc, char **argv) {
    /*PBS variables*/
    int con;
    struct batch_status *bs;
    /* my variables */
    char* server;
    const char* output_dir;

    if(argc != 3) {
        fprintf(stderr,"Usage: %s servername output_directory\n",argv[0]);
        return 1;
    }
    server = argv[1];
    output_dir = argv[2];
    
    con = pbs_connect(server);    
    if(con<0) {
        fprintf(stderr,"Cannot connect to %s, error %d \n",server,pbs_errno);
        return 1;
    }
    printf("Connected to %s\n", server);
    printf("Getting server info\n");
    /* get server info */
    bs = pbs_statserver(con, NULL, NULL);
    process_data_json(bs,"servers", output_dir);
    printf("Getting queues info\n");
    /* get queues info */
    bs = pbs_statque(con, "", NULL, NULL);
    process_data_json(bs,"queues", output_dir);
    printf("Getting nodes info\n");
    /* get nodes info */
    bs = pbs_statnode(con, "", NULL, NULL);
    process_data_json(bs,"nodes", output_dir);
    printf("Getting jobs info\n");
    /* get jobs info: t - job arrays, x - finished jobs*/
    bs = pbs_statjob(con, "", NULL, "tx");
    process_data_json(bs,"jobs", output_dir);
    printf("Getting reservations info\n");
    /* get reservations info */
    bs = pbs_statresv(con, NULL, NULL, NULL);
    process_data_json(bs,"reservations", output_dir);
    printf("Getting resources info\n");
    /* get resources info */
    bs = pbs_statrsc(con, NULL, NULL, NULL);
    process_data_json(bs,"resources", output_dir);
    printf("Getting scheduler info\n");
    /* get scheduler info */
    bs = pbs_statsched(con, NULL, NULL);
    process_data_json(bs,"schedulers", output_dir);
    /* get hook info */
    // printf("Getting hook info\n");
    // bs = pbs_stathook(con, NULL, NULL, NULL);
    // process_data_json(bs,"hooks");
    /* end connection */
    pbs_disconnect(con);
    return 0;
}

int process_data(struct batch_status *bs,char* type) {
    struct batch_status *tmp;
    struct attrl *atp;
    int i;
    int pocet=0;
    char filename[256];
    snprintf(filename, sizeof(filename), "%s.txt", type);
    FILE *fp = fopen(filename, "w");
    if (!fp) {
        fprintf(stderr, "Failed to open file %s for writing\n", filename);
        return -1;
    }
    /* count results */
    for(tmp=bs;tmp!=NULL;tmp=tmp->next) { pocet++; }

    fprintf(fp, "%s - pocet: %d\n",type,pocet);
    for(tmp=bs,i=0;tmp!=NULL;tmp=tmp->next,i++) {
        fprintf(fp, "--------   %s\n",tmp->name);

        for(atp=tmp->attribs;atp!=NULL;atp=atp->next) {
            if(atp->resource!=NULL) {
                fprintf(fp, "%s.%s=%s\n",atp->name,atp->resource,atp->value);
            } else {
                fprintf(fp, "%s=%s\n",atp->name,atp->value);
            }
        }
    }

    fprintf(fp, "\n\n\n-------------------\n\n\n");
    fclose(fp);

    /* free allocated memory */
    pbs_statfree(bs);
    return 0;
}

static void json_escape(const char *src, FILE *fp) {
    for (const char *p = src; *p; p++) {
        switch (*p) {
            case '\"': fputs("\\\"", fp); break;
            case '\\': fputs("\\\\", fp); break;
            case '\n': fputs("\\n", fp); break;
            case '\r': fputs("\\r", fp); break;
            case '\t': fputs("\\t", fp); break;
            default: fputc(*p, fp); break;
        }
    }
}

/* Main function */
int process_data_json(struct batch_status *bs, char *type, const char* output_dir) {
    struct batch_status *tmp;
    struct attrl *atp;
    int count = 0;
    char filename[512];

    snprintf(filename, sizeof(filename), "%s/%s.json", output_dir, type);
    FILE *fp = fopen(filename, "w");
    if (!fp) {
        fprintf(stderr, "Failed to open file %s for writing\n", filename);
        return -1;
    }

    /* Count items */
    for (tmp = bs; tmp != NULL; tmp = tmp->next)
        count++;

    /* Start JSON */
    fprintf(fp, "{\n");
    fprintf(fp, "  \"type\": \"%s\",\n", type);
    fprintf(fp, "  \"count\": %d,\n", count);
    fprintf(fp, "  \"items\": [\n");

    int i = 0;
    for (tmp = bs; tmp != NULL; tmp = tmp->next, i++) {
        fprintf(fp, "    {\n");
        fprintf(fp, "      \"name\": \"");
        json_escape(tmp->name, fp);
        fprintf(fp, "\",\n");
        fprintf(fp, "      \"attributes\": {\n");

        int j = 0;
        for (atp = tmp->attribs; atp != NULL; atp = atp->next, j++) {
            fprintf(fp, "        \"");
            json_escape(atp->name, fp);
            if (atp->resource != NULL) {
                fputc('.', fp);
                json_escape(atp->resource, fp);
            }
            fprintf(fp, "\": \"");
            json_escape(atp->value, fp);
            fprintf(fp, "\"");
            if (atp->next != NULL)
                fprintf(fp, ",");
            fputc('\n', fp);
        }

        fprintf(fp, "      }\n");
        fprintf(fp, "    }");
        if (tmp->next != NULL)
            fprintf(fp, ",");
        fputc('\n', fp);
    }

    fprintf(fp, "  ]\n");
    fprintf(fp, "}\n");

    fclose(fp);
    pbs_statfree(bs);
    return 0;
}