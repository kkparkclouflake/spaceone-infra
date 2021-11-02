import * as eks from '@aws-cdk/aws-eks'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as cdk from '@aws-cdk/core';
import { AwsUser } from '../constructs/aws-user';
import { DocumentDBCluster } from '../constructs/documentdb-cluster';
import { DomainProps } from './domain-props';

export interface EksProps extends cdk.StackProps {
    cluster: eks.Cluster,
    vpc: ec2.Vpc,
    
    createdDocdb?: DocumentDBCluster,
    createdDomain?: DomainProps,
    createdUser?: AwsUser,
}