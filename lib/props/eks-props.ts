import * as eks from '@aws-cdk/aws-eks'
import * as cdk from '@aws-cdk/core';

export interface EksProps extends cdk.StackProps {
    cluster: eks.Cluster
}