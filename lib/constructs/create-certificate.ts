import * as cdk from '@aws-cdk/core';
import * as acm from '@aws-cdk/aws-certificatemanager';

import { DomainProps } from '../props/domain-props';

export class CreateCertificate extends cdk.Construct {
    constructor(scope: cdk.Construct, id: string, props: DomainProps) {
        super(scope, id);

        let consoleCert = new acm.Certificate(this, 'Certificate', {
            domainName: '*.' + props.domainName,
            subjectAlternativeNames: [
                '*.console.' + props.domainName,
                'console-api.' + props.domainName
            ],
            validation: acm.CertificateValidation.fromDns(props.hostedZone),
        });

        props.certificate = consoleCert;
    }
}